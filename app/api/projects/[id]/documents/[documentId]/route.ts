import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getGoogleAccessToken } from "@/lib/google-oauth";
import { deleteFile } from "@/lib/google-drive";

/**
 * DELETE /api/projects/[id]/documents/[documentId]
 * Delete a document from Google Drive and database
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  try {
    const userId = await requireAuth();
    const { id: projectId, documentId } = await params;

    // Get user
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get document
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        projectId,
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
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

    // Extract file ID from URL
    const fileIdMatch = document.url.match(/\/d\/([^\/]+)/);
    if (!fileIdMatch) {
      return NextResponse.json(
        { error: "Invalid document URL" },
        { status: 400 }
      );
    }

    const fileId = fileIdMatch[1];

    // Delete from Google Drive
    await deleteFile(accessToken, fileId);

    // Delete from database
    await prisma.document.delete({
      where: { id: documentId },
    });

    return NextResponse.json({ message: "Document deleted successfully" });
  } catch (error: any) {
    console.error("Delete document error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete document" },
      { status: 500 }
    );
  }
}
