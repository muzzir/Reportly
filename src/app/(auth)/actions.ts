"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Signs in a user using email and password via Server Actions & Supabase SSR Server Client.
 */
export async function signIn(formData: FormData): Promise<{ error?: string }> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}

/**
 * Signs up a new agency owner user and creates agency organization records.
 */
export async function signUp(formData: FormData): Promise<{ error?: string }> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const agencyName = formData.get("agencyName") as string;

  if (!email || !password || !agencyName) {
    return { error: "Agency name, email, and password are required." };
  }

  const supabase = await createClient();

  // 1. Sign up user with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        agency_name: agencyName,
      },
    },
  });

  if (authError) {
    return { error: authError.message };
  }

  if (!authData.user) {
    return { error: "Failed to create user account." };
  }

  // 2. Create Agency Record
  const { data: agencyData, error: agencyError } = await supabase
    .from("agencies")
    .insert({
      name: agencyName,
    })
    .select()
    .single();

  if (agencyError) {
    console.error("Agency creation error:", agencyError);
    return { error: "User registered, but failed to create agency profile." };
  }

  // 3. Create Agency User & Member Owner Relationship
  const { error: userError } = await supabase
    .from("agency_users")
    .insert({
      agency_id: agencyData.id,
      user_id: authData.user.id,
      role: "owner",
    });

  if (userError) {
    console.error("Agency user creation error:", userError);
    // Fallback attempt to agency_members if trigger didn't handle it
    await supabase.from("agency_members").insert({
      agency_id: agencyData.id,
      user_id: authData.user.id,
      role: "owner",
    });
  }

  redirect("/dashboard");
}

/**
 * Signs out the current user session and redirects to login page.
 */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// Named aliases for client component form action support
export async function signInAction(formData: FormData) {
  return signIn(formData);
}

export async function signUpAction(formData: FormData) {
  return signUp(formData);
}

export async function signOutAction() {
  return signOut();
}
