import { createClient } from "@/lib/supabase/server";

export interface EmailWhitelistCheck {
  isWhitelisted: boolean;
  message: string;
}

/**
 * Check if an email address is whitelisted for registration
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
      .select("id, email, is_active")
      .eq("email", normalizedEmail)
      .eq("is_active", true)
      .single();

    if (error) {
      // If no record found, it means email is not whitelisted
      if (error.code === "PGRST116") {
        return {
          isWhitelisted: false,
          message:
            "This email address is not authorized to create an account. Please contact the farm administrator.",
        };
      }

      // Other database errors
      console.error("Error checking email whitelist:", error);
      return {
        isWhitelisted: false,
        message:
          "Unable to verify email authorization. Please try again later.",
      };
    }

    // Email found and is active
    if (data && data.is_active) {
      return {
        isWhitelisted: true,
        message: "Email authorized for registration.",
      };
    }

    // Email found but inactive
    return {
      isWhitelisted: false,
      message:
        "This email address has been deactivated. Please contact the farm administrator.",
    };
  } catch (error) {
    console.error("Unexpected error in checkEmailWhitelist:", error);
    return {
      isWhitelisted: false,
      message: "Unable to verify email authorization. Please try again later.",
    };
  }
}

/**
 * Add an email to the whitelist (admin function)
 */
export async function addEmailToWhitelist(
  email: string,
  notes?: string
): Promise<{ success: boolean; message: string }> {
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
        message: "You must be logged in to manage the email whitelist.",
      };
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return {
        success: false,
        message: "Please enter a valid email address.",
      };
    }

    // Insert email into whitelist
    const { data, error } = await supabase
      .from("email_whitelist")
      .insert({
        email: normalizedEmail,
        created_by: user.id,
        notes: notes || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      // Handle duplicate email
      if (error.code === "23505") {
        return {
          success: false,
          message: "This email is already in the whitelist.",
        };
      }

      console.error("Error adding email to whitelist:", error);
      return {
        success: false,
        message: "Failed to add email to whitelist. Please try again.",
      };
    }

    return {
      success: true,
      message: `Email ${normalizedEmail} has been added to the whitelist.`,
    };
  } catch (error) {
    console.error("Unexpected error in addEmailToWhitelist:", error);
    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Remove an email from the whitelist (set inactive)
 */
export async function removeEmailFromWhitelist(
  email: string
): Promise<{ success: boolean; message: string }> {
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
        message: "You must be logged in to manage the email whitelist.",
      };
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Set email as inactive instead of deleting
    const { error } = await supabase
      .from("email_whitelist")
      .update({ is_active: false })
      .eq("email", normalizedEmail);

    if (error) {
      console.error("Error removing email from whitelist:", error);
      return {
        success: false,
        message: "Failed to remove email from whitelist. Please try again.",
      };
    }

    return {
      success: true,
      message: `Email ${normalizedEmail} has been removed from the whitelist.`,
    };
  } catch (error) {
    console.error("Unexpected error in removeEmailFromWhitelist:", error);
    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Get all whitelisted emails (admin function)
 */
export async function getWhitelistedEmails() {
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
    throw error;
  }
}
