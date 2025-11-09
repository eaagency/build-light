import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getGoogleAccessToken } from "@/lib/google-oauth";
import { createFolder } from "@/lib/google-drive";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/projects/[id]/documents/create-folder
 * Create a new folder in Google Drive
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth();
    const { id: projectId } = await params;
    const { folderName, parentId } = await req.json();

    if (!folderName) {
      return NextResponse.json(
        { error: "Folder name is required" },
        { status: 400 }
      );
    }

    // Get Google OAuth token
    const accessToken = await getGoogleAccessToken(userId);

    if (!accessToken) {
      return NextResponse.json(
        { error: "Google Drive not connected" },
        { status: 401 }
      );
    }

    // If no parentId, use project's drive folder
    let targetParentId = parentId;
    if (!targetParentId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { driveFolderId: true },
      });

      if (!project?.driveFolderId) {
        return NextResponse.json(
          { error: "Project drive folder not set up" },
          { status: 400 }
        );
      }

      targetParentId = project.driveFolderId;
    }

    // Create folder
    const folder = await createFolder(accessToken, folderName, targetParentId);

    return NextResponse.json({ folder }, { status: 201 });
  } catch (error: any) {
    console.error("Create folder error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create folder" },
      { status: 500 }
    );
  }
}
