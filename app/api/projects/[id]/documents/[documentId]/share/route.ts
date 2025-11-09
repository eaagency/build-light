import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getGoogleAccessToken } from "@/lib/google-oauth";
import { google } from "googleapis";
import { enforceRateLimit } from "@/lib/rate-limit";

/**
 * POST /api/projects/[id]/documents/[documentId]/share
 * Share a document with specific permissions
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  try {
    const userId = await requireAuth();

    // Rate limiting: Standard for sharing documents
    const rateLimitResponse = await enforceRateLimit(req, userId, "standard");
    if (rateLimitResponse) return rateLimitResponse;

    const { id: projectId, documentId } = await params;
    const { email, role } = await req.json();

    // Validate input
    if (!email || !role) {
      return NextResponse.json(
        { error: "Email and role are required" },
        { status: 400 }
      );
    }

    if (!["reader", "writer", "commenter"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be reader, writer, or commenter" },
        { status: 400 }
      );
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

    // Share via Google Drive API
    const drive = google.drive({
      version: "v3",
      auth: new google.auth.OAuth2(),
    });
    drive.context._options.headers = {
      Authorization: `Bearer ${accessToken}`,
    };

    await drive.permissions.create({
      fileId,
      requestBody: {
        type: "user",
        role,
        emailAddress: email,
      },
      fields: "id",
      sendNotificationEmail: true,
    });

    return NextResponse.json({
      message: "Document shared successfully",
      email,
      role,
    });
  } catch (error: any) {
    console.error("Share document error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to share document" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/projects/[id]/documents/[documentId]/share
 * Get sharing link for a document (anyone with link)
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  try {
    const userId = await requireAuth();

    // Rate limiting: Standard for getting share links
    const rateLimitResponse = await enforceRateLimit(req, userId, "standard");
    if (rateLimitResponse) return rateLimitResponse;

    const { id: projectId, documentId } = await params;

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

    // Make file accessible to anyone with link
    const drive = google.drive({
      version: "v3",
      auth: new google.auth.OAuth2(),
    });
    drive.context._options.headers = {
      Authorization: `Bearer ${accessToken}`,
    };

    await drive.permissions.create({
      fileId,
      requestBody: {
        type: "anyone",
        role: "reader",
      },
      fields: "id",
    });

    // Get shareable link
    const file = await drive.files.get({
      fileId,
      fields: "webViewLink",
    });

    return NextResponse.json({
      shareLink: file.data.webViewLink,
    });
  } catch (error: any) {
    console.error("Get share link error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get share link" },
      { status: 500 }
    );
  }
}
