import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getGoogleAccessToken } from "@/lib/google-oauth";
import { createFolder } from "@/lib/google-drive";

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
    await params;
    const { folderName, parentId } = await req.json();

    if (!folderName || !parentId) {
      return NextResponse.json(
        { error: "Folder name and parent ID are required" },
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

    // Create folder
    const folder = await createFolder(accessToken, folderName, parentId);

    return NextResponse.json({ folder }, { status: 201 });
  } catch (error: any) {
    console.error("Create folder error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create folder" },
      { status: 500 }
    );
  }
}
