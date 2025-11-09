import Stripe from "stripe";
import { prisma } from "./prisma";
import { Plan, SubscriptionStatus } from "./types";

// Initialize Stripe
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-10-29.clover",
  typescript: true,
});

/**
 * Create a Stripe customer for an organization
 */
export async function createStripeCustomer(
  organizationId: string,
  email: string,
  name: string
): Promise<string> {
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      organizationId,
    },
  });

  // Update organization with Stripe customer ID
  await prisma.organization.update({
    where: { id: organizationId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

/**
 * Create a checkout session for subscription with 14-day trial
 */
export async function createCheckoutSession({
  organizationId,
  customerId,
  priceId,
  successUrl,
  cancelUrl,
}: {
  organizationId: string;
  customerId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<Stripe.Checkout.Session> {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    subscription_data: {
      trial_period_days: 14,
      metadata: {
        organizationId,
      },
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
  });

  return session;
}

/**
 * Create a billing portal session for subscription management
 */
export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session;
}

/**
 * Handle successful subscription creation
 */
export async function handleSubscriptionCreated(
  subscription: Stripe.Subscription
): Promise<void> {
  const organizationId = subscription.metadata.organizationId;
  if (!organizationId) return;

  // Determine plan based on price ID
  let plan: Plan = Plan.STARTER;
  if (subscription.items.data[0]?.price.id === process.env.STRIPE_PRO_PRICE_ID) {
    plan = Plan.PRO;
  }

  // Calculate trial end date
  const trialEndsAt = subscription.trial_end
    ? new Date(subscription.trial_end * 1000)
    : null;

  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      plan,
      subscriptionId: subscription.id,
      subscriptionStatus: mapStripeStatus(subscription.status),
      trialEndsAt,
    },
  });
}

/**
 * Handle subscription updates
 */
export async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
): Promise<void> {
  const organizationId = subscription.metadata.organizationId;
  if (!organizationId) return;

  // Determine plan based on price ID
  let plan: Plan = Plan.STARTER;
  if (subscription.items.data[0]?.price.id === process.env.STRIPE_PRO_PRICE_ID) {
    plan = Plan.PRO;
  }

  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      plan,
      subscriptionStatus: mapStripeStatus(subscription.status),
    },
  });
}

/**
 * Handle subscription deletion/cancellation
 */
export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
): Promise<void> {
  const organizationId = subscription.metadata.organizationId;
  if (!organizationId) return;

  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      subscriptionStatus: SubscriptionStatus.CANCELED,
    },
  });
}

/**
 * Map Stripe subscription status to our enum
 */
function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  const statusMap: Record<Stripe.Subscription.Status, SubscriptionStatus> = {
    active: SubscriptionStatus.ACTIVE,
    trialing: SubscriptionStatus.TRIALING,
    past_due: SubscriptionStatus.PAST_DUE,
    canceled: SubscriptionStatus.CANCELED,
    incomplete: SubscriptionStatus.INCOMPLETE,
    incomplete_expired: SubscriptionStatus.INCOMPLETE_EXPIRED,
    unpaid: SubscriptionStatus.UNPAID,
    paused: SubscriptionStatus.PAST_DUE, // Map paused to past_due
  };

  return statusMap[status] || SubscriptionStatus.INCOMPLETE;
}

/**
 * Get organization subscription details
 */
export async function getOrganizationSubscription(organizationId: string) {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      plan: true,
      subscriptionStatus: true,
      subscriptionId: true,
      trialEndsAt: true,
      stripeCustomerId: true,
    },
  });

  if (!org?.subscriptionId) {
    return null;
  }

  const subscription = await stripe.subscriptions.retrieve(org.subscriptionId);

  return {
    ...org,
    subscription,
  };
}

/**
 * Check if organization is on trial
 */
export async function isOnTrial(organizationId: string): Promise<boolean> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { subscriptionStatus: true, trialEndsAt: true },
  });

  if (!org) return false;

  return (
    org.subscriptionStatus === SubscriptionStatus.TRIALING &&
    org.trialEndsAt !== null &&
    new Date() < org.trialEndsAt
  );
}

/**
 * Check if organization has active subscription
 */
export async function hasActiveSubscription(
  organizationId: string
): Promise<boolean> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { subscriptionStatus: true },
  });

  if (!org) return false;

  return (
    org.subscriptionStatus === SubscriptionStatus.ACTIVE ||
    org.subscriptionStatus === SubscriptionStatus.TRIALING
  );
}
