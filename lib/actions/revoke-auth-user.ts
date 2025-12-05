"use server";

import { createServiceRoleClient } from "@/lib/supabase/service-role";

export async function revokeAuthUserByEmail(email: string) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn(
      "SUPABASE_SERVICE_ROLE_KEY is not configured; skipping auth user revocation."
    );
    return;
  }

  try {
    const supabaseAdmin = createServiceRoleClient();
    const normalizedEmail = email.toLowerCase().trim();

    // Use Admin API to list users and find by email
    const { data: usersData, error: listError } =
      await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      console.error("Failed to list users for revocation:", listError);
      return;
    }

    // Find user by email
    const authUser = usersData.users.find(
      (u) => u.email?.toLowerCase() === normalizedEmail
    );

    if (!authUser?.id) {
      console.log("No auth user found for email:", normalizedEmail);
      return;
    }

    console.log("Found auth user to delete:", authUser.id, authUser.email);

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
      authUser.id
    );

    if (deleteError) {
      console.error("Failed to delete Supabase auth user:", deleteError);
    } else {
      console.log("Successfully deleted auth user:", normalizedEmail);
    }
  } catch (error) {
    console.error("Unexpected error revoking auth user:", error);
  }
}
