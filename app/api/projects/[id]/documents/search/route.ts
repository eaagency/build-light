import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getGoogleAccessToken } from "@/lib/google-oauth";
import { searchFiles } from "@/lib/google-drive";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/projects/[id]/documents/search
 * Search documents in project
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth();
    const { id: projectId } = await params;
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // Get project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project?.driveFolderId) {
      return NextResponse.json(
        { error: "Project Drive folder not configured" },
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

    // Search files
    const results = await searchFiles(
      accessToken,
      project.driveFolderId,
      query
    );

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error("Search documents error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to search documents" },
      { status: 500 }
    );
  }
}
