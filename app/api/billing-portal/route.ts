import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { createBillingPortalSession } from "@/lib/stripe";
import { enforceRateLimit } from "@/lib/rate-limit";

/**
 * Create a Stripe billing portal session
 * POST /api/billing-portal
 */
export async function POST(req: Request) {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in and join an organization" },
        { status: 401 }
      );
    }

    // Rate limiting: Strict for billing operations (very sensitive)
    const rateLimitResponse = await enforceRateLimit(req, userId, "strict");
    if (rateLimitResponse) return rateLimitResponse;

    // Get organization with Stripe customer ID
    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { stripeCustomerId: true },
    });

    if (!organization?.stripeCustomerId) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 404 }
      );
    }

    // Create billing portal session
    const session = await createBillingPortalSession(
      organization.stripeCustomerId,
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings`
    );

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Billing portal error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create billing portal session" },
      { status: 500 }
    );
  }
}
