import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { createStripeCustomer, createCheckoutSession } from "@/lib/stripe";

/**
 * Create a Stripe checkout session for subscription
 * POST /api/checkout
 * Body: { plan: "STARTER" | "PRO" }
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

    const { plan } = await req.json();

    if (!plan || !["STARTER", "PRO"].includes(plan)) {
      return NextResponse.json(
        { error: "Invalid plan specified" },
        { status: 400 }
      );
    }

    // Get organization
    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Get user for email
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    // Create Stripe customer if doesn't exist
    let customerId = organization.stripeCustomerId;
    if (!customerId) {
      customerId = await createStripeCustomer(
        orgId,
        user?.email || "",
        organization.name
      );
    }

    // Determine price ID based on plan
    const priceId =
      plan === "PRO"
        ? process.env.STRIPE_PRO_PRICE_ID!
        : process.env.STRIPE_STARTER_PRICE_ID!;

    // Create checkout session with 14-day trial
    const session = await createCheckoutSession({
      organizationId: orgId,
      customerId,
      priceId,
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/?canceled=true`,
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
