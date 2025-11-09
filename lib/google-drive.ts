import { google } from "googleapis";
import { prisma } from "./prisma";

/**
 * Create Google Drive client with OAuth2 credentials
 * Note: User must have authenticated via Clerk with Google OAuth
 */
export function getDriveClient(accessToken: string) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    access_token: accessToken,
  });

  return google.drive({ version: "v3", auth: oauth2Client });
}

/**
 * Create BuildLight folder structure for organization
 * Structure:
 * - BuildLight/
 *   - Projects/
 *   - Documents/
 *   - Invoices/
 *   - Photos/
 */
export async function createOrganizationFolderStructure(
  accessToken: string,
  organizationId: string,
  organizationName: string
): Promise<string> {
  const drive = getDriveClient(accessToken);

  // Create main BuildLight folder
  const mainFolder = await drive.files.create({
    requestBody: {
      name: `BuildLight - ${organizationName}`,
      mimeType: "application/vnd.google-apps.folder",
    },
    fields: "id, name, webViewLink",
  });

  const mainFolderId = mainFolder.data.id!;

  // Create subfolders
  const subfolders = ["Projects", "Documents", "Invoices", "Photos"];

  await Promise.all(
    subfolders.map((folderName) =>
      drive.files.create({
        requestBody: {
          name: folderName,
          mimeType: "application/vnd.google-apps.folder",
          parents: [mainFolderId],
        },
        fields: "id, name",
      })
    )
  );

  // Update organization with folder ID
  await prisma.organization.update({
    where: { id: organizationId },
    data: { driveFolderId: mainFolderId },
  });

  return mainFolderId;
}

/**
 * Create project folder within organization's Projects folder
 * Structure:
 * - Projects/
 *   - [Project Name]/
 *     - Plans/
 *     - Photos/
 *     - Documents/
 *     - Invoices/
 */
export async function createProjectFolder(
  accessToken: string,
  projectId: string,
  projectName: string,
  organizationFolderId: string
): Promise<string> {
  const drive = getDriveClient(accessToken);

  // Find the Projects subfolder
  const projectsFolder = await drive.files.list({
    q: `name='Projects' and '${organizationFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: "files(id, name)",
  });

  const projectsFolderId = projectsFolder.data.files?.[0]?.id;

  if (!projectsFolderId) {
    throw new Error("Projects folder not found");
  }

  // Create project folder
  const projectFolder = await drive.files.create({
    requestBody: {
      name: projectName,
      mimeType: "application/vnd.google-apps.folder",
      parents: [projectsFolderId],
    },
    fields: "id, name, webViewLink",
  });

  const projectFolderId = projectFolder.data.id!;

  // Create project subfolders
  const subfolders = ["Plans", "Photos", "Documents", "Invoices"];

  await Promise.all(
    subfolders.map((folderName) =>
      drive.files.create({
        requestBody: {
          name: folderName,
          mimeType: "application/vnd.google-apps.folder",
          parents: [projectFolderId],
        },
        fields: "id, name",
      })
    )
  );

  // Update project with folder ID
  await prisma.project.update({
    where: { id: projectId },
    data: { driveFolderId: projectFolderId },
  });

  return projectFolderId;
}

/**
 * Upload file to Google Drive folder
 */
export async function uploadFile(
  accessToken: string,
  folderId: string,
  fileName: string,
  mimeType: string,
  fileBuffer: Buffer
): Promise<string> {
  const drive = getDriveClient(accessToken);

  const response = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [folderId],
    },
    media: {
      mimeType,
      body: fileBuffer as any,
    },
    fields: "id, name, webViewLink",
  });

  return response.data.id!;
}

/**
 * List files in a folder
 */
export async function listFiles(accessToken: string, folderId: string) {
  const drive = getDriveClient(accessToken);

  const response = await drive.files.list({
    q: `'${folderId}' in parents and trashed=false`,
    fields: "files(id, name, mimeType, createdTime, modifiedTime, size, webViewLink, thumbnailLink)",
    orderBy: "modifiedTime desc",
  });

  return response.data.files || [];
}

/**
 * Delete file from Google Drive
 */
export async function deleteFile(accessToken: string, fileId: string) {
  const drive = getDriveClient(accessToken);
  await drive.files.delete({ fileId });
}

/**
 * Get folder web view link
 */
export async function getFolderLink(
  accessToken: string,
  folderId: string
): Promise<string> {
  const drive = getDriveClient(accessToken);

  const response = await drive.files.get({
    fileId: folderId,
    fields: "webViewLink",
  });

  return response.data.webViewLink || "";
}

/**
 * Share folder with team member
 */
export async function shareFolderWithUser(
  accessToken: string,
  folderId: string,
  email: string,
  role: "reader" | "writer" | "commenter" = "writer"
) {
  const drive = getDriveClient(accessToken);

  await drive.permissions.create({
    fileId: folderId,
    requestBody: {
      type: "user",
      role,
      emailAddress: email,
    },
    sendNotificationEmail: true,
  });
}

/**
 * Get file or folder details
 */
export async function getFileDetails(accessToken: string, fileId: string) {
  const drive = getDriveClient(accessToken);

  const response = await drive.files.get({
    fileId,
    fields: "id, name, mimeType, createdTime, modifiedTime, size, webViewLink, thumbnailLink, iconLink, owners, permissions",
  });

  return response.data;
}

/**
 * Search files by name
 */
export async function searchFiles(
  accessToken: string,
  folderId: string,
  query: string
) {
  const drive = getDriveClient(accessToken);

  const response = await drive.files.list({
    q: `'${folderId}' in parents and name contains '${query}' and trashed=false`,
    fields: "files(id, name, mimeType, createdTime, modifiedTime, size, webViewLink, thumbnailLink)",
    orderBy: "modifiedTime desc",
  });

  return response.data.files || [];
}

/**
 * Move file to different folder
 */
export async function moveFile(
  accessToken: string,
  fileId: string,
  newParentId: string,
  oldParentId?: string
) {
  const drive = getDriveClient(accessToken);

  const params: any = {
    fileId,
    addParents: newParentId,
    fields: "id, parents",
  };

  if (oldParentId) {
    params.removeParents = oldParentId;
  }

  const response = await drive.files.update(params);
  return response.data;
}

/**
 * Create a new folder
 */
export async function createFolder(
  accessToken: string,
  folderName: string,
  parentId: string
) {
  const drive = getDriveClient(accessToken);

  const response = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    },
    fields: "id, name, webViewLink",
  });

  return response.data;
}

/**
 * Get folder contents (folders and files separated)
 */
export async function getFolderContents(accessToken: string, folderId: string) {
  const drive = getDriveClient(accessToken);

  const response = await drive.files.list({
    q: `'${folderId}' in parents and trashed=false`,
    fields: "files(id, name, mimeType, createdTime, modifiedTime, size, webViewLink, thumbnailLink, iconLink)",
    orderBy: "folder,modifiedTime desc",
  });

  const files = response.data.files || [];

  // Separate folders and files
  const folders = files.filter(
    (f) => f.mimeType === "application/vnd.google-apps.folder"
  );
  const documents = files.filter(
    (f) => f.mimeType !== "application/vnd.google-apps.folder"
  );

  return { folders, documents };
}

/**
 * Download file
 */
export async function downloadFile(accessToken: string, fileId: string) {
  const drive = getDriveClient(accessToken);

  const response = await drive.files.get(
    {
      fileId,
      alt: "media",
    },
    { responseType: "arraybuffer" }
  );

  return response.data;
}

/**
 * Get recent files from a folder
 */
export async function getRecentFiles(
  accessToken: string,
  folderId: string,
  limit: number = 10
) {
  const drive = getDriveClient(accessToken);

  const response = await drive.files.list({
    q: `'${folderId}' in parents and trashed=false`,
    fields: "files(id, name, mimeType, createdTime, modifiedTime, size, webViewLink, thumbnailLink)",
    orderBy: "modifiedTime desc",
    pageSize: limit,
  });

  return response.data.files || [];
}
