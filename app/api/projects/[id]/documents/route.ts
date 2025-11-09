import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { getGoogleAccessToken } from "@/lib/google-oauth";
import {
  getFolderContents,
  uploadFile,
  createProjectFolder,
  getRecentFiles,
} from "@/lib/google-drive";
import { validateFile } from "@/lib/file-validation";

/**
 * GET /api/projects/[id]/documents
 * Get all documents for a project
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth();
    const { id: projectId } = await params;

    // Get project with folder info
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        documents: {
          include: {
            uploadedBy: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Get Google OAuth token
    const accessToken = await getGoogleAccessToken(userId);

    if (!accessToken) {
      return NextResponse.json(
        { error: "Google Drive not connected. Please connect your Google account." },
        { status: 401 }
      );
    }

    // If project doesn't have a Drive folder, create one
    let driveFolderId = project.driveFolderId;
    if (!driveFolderId) {
      // Get organization drive folder
      const org = await prisma.organization.findUnique({
        where: { id: project.organizationId },
      });

      if (!org?.driveFolderId) {
        return NextResponse.json(
          { error: "Organization Drive folder not set up" },
          { status: 400 }
        );
      }

      // Create project folder
      driveFolderId = await createProjectFolder(
        accessToken,
        project.id,
        project.name,
        org.driveFolderId
      );
    }

    // Get folder contents from Google Drive
    const { folders, documents: driveDocuments } = await getFolderContents(
      accessToken,
      driveFolderId
    );

    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name,
        driveFolderId,
      },
      folders,
      documents: project.documents,
      driveDocuments,
    });
  } catch (error: any) {
    console.error("Get documents error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch documents" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects/[id]/documents
 * Upload a document to Google Drive
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth();
    const { id: projectId } = await params;

    // Get form data
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const folderId = formData.get("folderId") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // CRITICAL: Server-side validation (never trust client)
    const validationResult = validateFile(file);
    if (!validationResult.valid) {
      return NextResponse.json(
        { error: validationResult.error },
        { status: 400 }
      );
    }

    // Get project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Get user for database record
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get Google OAuth token
    const accessToken = await getGoogleAccessToken(userId);

    if (!accessToken) {
      return NextResponse.json(
        { error: "Google Drive not connected" },
        { status: 401 }
      );
    }

    // Determine folder to upload to
    const targetFolderId = folderId || project.driveFolderId;

    if (!targetFolderId) {
      return NextResponse.json(
        { error: "No drive folder configured" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Google Drive
    const driveFileId = await uploadFile(
      accessToken,
      targetFolderId,
      file.name,
      file.type,
      buffer
    );

    // Get the Drive file URL
    const driveUrl = `https://drive.google.com/file/d/${driveFileId}/view`;

    // Save document record in database
    const document = await prisma.document.create({
      data: {
        projectId,
        name: file.name,
        url: driveUrl,
        folderId: targetFolderId,
        uploadedById: user.id,
        mimeType: file.type,
        size: BigInt(file.size),
      },
      include: {
        uploadedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ document }, { status: 201 });
  } catch (error: any) {
    console.error("Upload document error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload document" },
      { status: 500 }
    );
  }
}
