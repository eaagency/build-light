import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getGoogleAccessToken } from "@/lib/google-oauth";
import { getFolderContents } from "@/lib/google-drive";
import { enforceRateLimit } from "@/lib/rate-limit";

/**
 * GET /api/projects/[id]/documents/folders/[folderId]
 * Browse contents of a specific folder
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; folderId: string }> }
) {
  try {
    const userId = await requireAuth();

    // Rate limiting: Generous for GET requests
    const rateLimitResponse = await enforceRateLimit(req, userId, "generous");
    if (rateLimitResponse) return rateLimitResponse;

    const { folderId } = await params;

    // Get Google OAuth token
    const accessToken = await getGoogleAccessToken(userId);

    if (!accessToken) {
      return NextResponse.json(
        { error: "Google Drive not connected" },
        { status: 401 }
      );
    }

    // Get folder contents
    const { folders, documents } = await getFolderContents(
      accessToken,
      folderId
    );

    return NextResponse.json({ folders, documents });
  } catch (error: any) {
    console.error("Get folder contents error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get folder contents" },
      { status: 500 }
    );
  }
}
