import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import type { ProfileAdminFlag } from "@/types/profile";

function signInError(origin: string, message: string) {
  const url = new URL("/", origin);
  url.searchParams.set("error", message);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");

  // Supabase sends errors here instead of a code when Google sign-in fails.
  // Never echo the raw description: it can contain Google's authorization code.
  if (searchParams.has("error") || searchParams.has("error_description")) {
    const description = searchParams.get("error_description") ?? "";
    let message = "Google sign-in failed. Please try again.";

    if (searchParams.get("error") === "access_denied") {
      message = "Google sign-in was cancelled or access was denied. Please try again.";
    } else if (description.startsWith("Unable to exchange external code")) {
      message = "Supabase could not complete sign-in with Google. Check that the Google client ID and client secret in Supabase match the same Google Cloud OAuth client, then try again.";
    } else if (description.includes("Database error saving new user")) {
      message = "Supabase could not create your account. Check the Supabase Auth logs and the database trigger that creates user profiles.";
    }

    return signInError(origin, message);
  }

  if (!code) {
    return signInError(origin, "The sign-in link is incomplete. Start again using Log in with Google.");
  }

  try {
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      return signInError(origin, "The sign-in link could not be verified or has expired. Start again using Log in with Google.");
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      await supabase.auth.signOut({ scope: "local" });
      return signInError(origin, "Failed to get user information");
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_superadmin")
      .eq("id", user.id)
      .single<ProfileAdminFlag>();

    if (profileError) {
      await supabase.auth.signOut({ scope: "local" });
      return signInError(origin, "Error checking user profile");
    }

    if (!profile?.is_superadmin) {
      await supabase.auth.signOut({ scope: "local" });
      return signInError(origin, "Access denied. Superadmin privileges required.");
    }

    return NextResponse.redirect(new URL("/overview", origin));
  } catch {
    return signInError(origin, "An unexpected error occurred during sign in. Please try again.");
  }
}
