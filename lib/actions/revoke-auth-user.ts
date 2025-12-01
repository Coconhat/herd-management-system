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

    const { data, error } = await supabaseAdmin
      .from("auth.users")
      .select("id")
      .eq("email", normalizedEmail)
      .limit(1);

    if (error) {
      console.error("Failed to locate auth user for revocation:", error);
      return;
    }

    const authUser = Array.isArray(data) ? data[0] : null;
    if (!authUser?.id) {
      return;
    }

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
      authUser.id
    );

    if (deleteError) {
      console.error("Failed to delete Supabase auth user:", deleteError);
    }
  } catch (error) {
    console.error("Unexpected error revoking auth user:", error);
  }
}
