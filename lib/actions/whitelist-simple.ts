"use server";

import { revokeAuthUserByEmail } from "@/lib/actions/revoke-auth-user";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface WhitelistEmail {
  id: number;
  email: string;
  is_active: boolean;
  is_registered: boolean;
  notes: string | null;
  created_at: string;
  created_by: string | null;
}

export interface EmailWhitelistCheck {
  isWhitelisted: boolean;
  message: string;
}

export interface AddEmailResult {
  success: boolean;
  message: string;
}

export interface RemoveEmailResult {
  success: boolean;
  message: string;
}

/**
 * Check if an email address is whitelisted and can register
 */
export async function checkEmailWhitelist(
  email: string
): Promise<EmailWhitelistCheck> {
  try {
    const supabase = await createClient();

    // Normalize email to lowercase for consistent checking
    const normalizedEmail = email.toLowerCase().trim();

    // Check if email exists in whitelist and is active
    const { data, error } = await supabase
      .from("email_whitelist")
      .select("id, email, is_active, is_registered")
      .eq("email", normalizedEmail)
      .eq("is_active", true)
      .single();

    if (error) {
      // If no record found, email is not whitelisted
      if (error.code === "PGRST116") {
        return {
          isWhitelisted: false,
          message:
            "This email is not authorized. Please contact your administrator to be added to the whitelist.",
        };
      }
      throw error;
    }

    // Check if already registered
    if (data.is_registered) {
      return {
        isWhitelisted: false,
        message:
          "An account with this email already exists. Please use the login page.",
      };
    }

    return {
      isWhitelisted: true,
      message: "Email is authorized for registration",
    };
  } catch (error) {
    console.error("Error checking email whitelist:", error);
    return {
      isWhitelisted: false,
      message: "Error checking authorization status. Please try again.",
    };
  }
}

/**
 * Mark an email as registered after successful signup
 */
export async function markEmailAsRegistered(email: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    const normalizedEmail = email.toLowerCase().trim();

    const { error } = await supabase
      .from("email_whitelist")
      .update({ is_registered: true })
      .eq("email", normalizedEmail);

    if (error) {
      console.error("Error marking email as registered:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Unexpected error marking email as registered:", error);
    return false;
  }
}

/**
 * Get all whitelisted emails (admin function)
 */
export async function getWhitelistedEmails(): Promise<WhitelistEmail[]> {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Authentication required");
    }

    const { data, error } = await supabase
      .from("email_whitelist")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching whitelisted emails:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Unexpected error in getWhitelistedEmails:", error);
    return [];
  }
}

/**
 * Add an email to the whitelist (admin function)
 */
export async function addEmailToWhitelist(
  email: string,
  notes?: string
): Promise<AddEmailResult> {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        message: "Authentication required",
      };
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return {
        success: false,
        message: "Invalid email format",
      };
    }

    // Check if email is already whitelisted
    const { data: existingEmail } = await supabase
      .from("email_whitelist")
      .select("id, is_active")
      .eq("email", normalizedEmail)
      .single();

    if (existingEmail) {
      if (existingEmail.is_active) {
        return {
          success: false,
          message: "This email is already in the whitelist",
        };
      } else {
        // Reactivate the email
        const { error: updateError } = await supabase
          .from("email_whitelist")
          .update({ is_active: true, notes: notes || null })
          .eq("email", normalizedEmail);

        if (updateError) {
          throw updateError;
        }

        revalidatePath("/admin");
        return {
          success: true,
          message: "Email reactivated successfully",
        };
      }
    }

    // Insert email into whitelist
    const { error } = await supabase.from("email_whitelist").insert({
      email: normalizedEmail,
      created_by: user.id,
      notes: notes || null,
      is_active: true,
      is_registered: false,
    });

    if (error) {
      console.error("Error adding email to whitelist:", error);
      throw error;
    }

    revalidatePath("/admin");
    return {
      success: true,
      message: `${normalizedEmail} has been added to the whitelist. They can now sign up at the registration page.`,
    };
  } catch (error) {
    console.error("Unexpected error in addEmailToWhitelist:", error);
    return {
      success: false,
      message: "Failed to add email to whitelist",
    };
  }
}

/**
 * Remove an email from the whitelist (deactivate it)
 */
export async function removeEmailFromWhitelist(
  email: string
): Promise<RemoveEmailResult> {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        message: "Authentication required",
      };
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Revoke any existing Supabase Auth user before disabling whitelist entry
    await revokeAuthUserByEmail(normalizedEmail);

    // Deactivate instead of delete (keep history)
    const { error } = await supabase
      .from("email_whitelist")
      .update({ is_active: false })
      .eq("email", normalizedEmail);

    if (error) {
      console.error("Error removing email from whitelist:", error);
      throw error;
    }

    revalidatePath("/admin");
    return {
      success: true,
      message: "Email removed and login access revoked",
    };
  } catch (error) {
    console.error("Unexpected error in removeEmailFromWhitelist:", error);
    return {
      success: false,
      message: "Failed to remove email from whitelist",
    };
  }
}

/**
 * Permanently delete an email from whitelist (admin function)
 */
export async function deleteEmailFromWhitelist(
  email: string
): Promise<RemoveEmailResult> {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        message: "Authentication required",
      };
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Ensure any linked Supabase Auth account is also removed
    await revokeAuthUserByEmail(normalizedEmail);

    const { error } = await supabase
      .from("email_whitelist")
      .delete()
      .eq("email", normalizedEmail);

    if (error) {
      console.error("Error deleting email from whitelist:", error);
      throw error;
    }

    revalidatePath("/admin");
    return {
      success: true,
      message: "Email deleted and login access revoked",
    };
  } catch (error) {
    console.error("Unexpected error in deleteEmailFromWhitelist:", error);
    return {
      success: false,
      message: "Failed to delete email from whitelist",
    };
  }
}
