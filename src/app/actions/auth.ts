"use client";

import { createClient } from "@/lib/supabase/client";

export async function signUpAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const agencyName = formData.get("agencyName") as string;

  if (!email || !password || !agencyName) {
    return { error: "Agency name, email, and password are required." };
  }

  const supabase = createClient();

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

  // 3. Create Agency Member Owner Relationship
  const { error: memberError } = await supabase
    .from("agency_members")
    .insert({
      agency_id: agencyData.id,
      user_id: authData.user.id,
      role: "owner",
    });

  if (memberError) {
    console.error("Agency member error:", memberError);
  }

  return { success: true };
}

export async function signInAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function signOutAction() {
  const supabase = createClient();
  await supabase.auth.signOut();
  return { success: true };
}
