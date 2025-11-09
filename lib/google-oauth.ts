import { clerkClient } from "@clerk/nextjs/server";

/**
 * Get Google OAuth access token for a user
 * This retrieves the token from Clerk's OAuth integration
 */
export async function getGoogleAccessToken(userId: string): Promise<string | null> {
  try {
    const client = await clerkClient();

    // Get the user's OAuth access token from Clerk
    const response = await client.users.getUserOauthAccessToken(
      userId,
      "oauth_google"
    );

    if (response && response.data && response.data.length > 0) {
      return response.data[0].token;
    }

    return null;
  } catch (error) {
    console.error("Error getting Google access token:", error);
    return null;
  }
}

/**
 * Check if user has connected their Google account
 */
export async function hasGoogleConnection(userId: string): Promise<boolean> {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);

    const googleAccount = user.externalAccounts?.find(
      (account) => account.provider === "google"
    );

    return !!googleAccount;
  } catch (error) {
    console.error("Error checking Google connection:", error);
    return false;
  }
}

/**
 * Get user's Google account email
 */
export async function getGoogleEmail(userId: string): Promise<string | null> {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);

    const googleAccount = user.externalAccounts?.find(
      (account) => account.provider === "google"
    );

    return googleAccount?.emailAddress || null;
  } catch (error) {
    console.error("Error getting Google email:", error);
    return null;
  }
}
