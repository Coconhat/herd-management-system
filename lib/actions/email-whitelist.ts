import { revokeAuthUserByEmail } from "@/lib/actions/revoke-auth-user";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

export interface EmailWhitelistCheck {
  isWhitelisted: boolean;
  message: string;
}

export interface AddEmailResult {
  success: boolean;
  message: string;
  invitationUrl?: string;
  credentials?: {
    email: string;
    password: string;
  };
}

export interface RemoveEmailResult {
  success: boolean;
  message: string;
}

export interface InvitationVerification {
  isValid: boolean;
  email?: string;
  message: string;
}

/**
 * Generate a secure invitation token
 */
function generateInvitationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Generate a secure password
 */
function generatePassword(): string {
  const length = 12;
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
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
          message: "Email address is not whitelisted for registration",
        };
      }
      throw error;
    }

    return {
      isWhitelisted: true,
      message: "Email is whitelisted and can register",
    };
  } catch (error) {
    console.error("Error checking email whitelist:", error);
    return {
      isWhitelisted: false,
      message: "Error checking email whitelist status",
    };
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
          message: "Email is already whitelisted",
        };
      } else {
        // Reactivate the email
        const { error: updateError } = await supabase
          .from("email_whitelist")
          .update({ is_active: true, is_registered: false })
          .eq("email", normalizedEmail);

        if (updateError) {
          throw updateError;
        }

        return {
          success: true,
          message: "Email reactivated in whitelist",
        };
      }
    }

    // Generate invitation token and expiry (7 days from now)
    const invitationToken = generateInvitationToken();
    const invitationExpiresAt = new Date();
    invitationExpiresAt.setDate(invitationExpiresAt.getDate() + 7);

    // Insert email into whitelist with invitation token
    const { data, error } = await supabase
      .from("email_whitelist")
      .insert({
        email: normalizedEmail,
        created_by: user.id,
        notes: notes || null,
        is_active: true,
        invitation_token: invitationToken,
        invitation_expires_at: invitationExpiresAt.toISOString(),
        invitation_sent_at: new Date().toISOString(),
        is_registered: false,
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding email to whitelist:", error);
      throw error;
    }

    // Generate invitation URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const invitationUrl = `${baseUrl}/auth/invite?token=${invitationToken}`;

    return {
      success: true,
      message: "Email added to whitelist successfully",
      invitationUrl,
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
 * Create account directly with email and password (admin function)
 */
export async function createAccountDirectly(
  email: string,
  notes?: string,
  customPassword?: string
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

    // Check if email already exists in auth system
    const { data: existingUser, error: checkError } =
      await supabase.auth.admin.listUsers();

    if (checkError) {
      console.error("Error checking existing users:", checkError);
      return {
        success: false,
        message: "Failed to check existing users",
      };
    }

    const userExists = existingUser.users.some(
      (u) => u.email === normalizedEmail
    );
    if (userExists) {
      return {
        success: false,
        message: "User with this email already exists",
      };
    }

    // Generate password if not provided
    const password = customPassword || generatePassword();

    // Create user in Supabase Auth
    const { data: newUser, error: createError } =
      await supabase.auth.admin.createUser({
        email: normalizedEmail,
        password: password,
        email_confirm: true, // Auto-confirm email
      });

    if (createError) {
      console.error("Error creating user:", createError);
      return {
        success: false,
        message: `Failed to create user: ${createError.message}`,
      };
    }

    // Add to whitelist for tracking
    const { error: whitelistError } = await supabase
      .from("email_whitelist")
      .insert({
        email: normalizedEmail,
        created_by: user.id,
        notes: notes || null,
        is_active: true,
        invitation_token: null, // No token needed for direct creation
        invitation_expires_at: null,
        invitation_sent_at: new Date().toISOString(),
        is_registered: true, // Already registered
      });

    if (whitelistError) {
      console.error("Error adding to whitelist:", whitelistError);
      // Don't fail the whole operation, just log it
    }

    return {
      success: true,
      message: "User account created successfully",
      credentials: {
        email: normalizedEmail,
        password: password,
      },
    };
  } catch (error) {
    console.error("Unexpected error in createAccountDirectly:", error);
    return {
      success: false,
      message: "Failed to create user account",
    };
  }
}

/**
 * Remove an email from the whitelist (admin function)
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

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Check if email exists in whitelist
    const { data: existingEmail } = await supabase
      .from("email_whitelist")
      .select("id, is_active")
      .eq("email", normalizedEmail)
      .single();

    if (!existingEmail) {
      return {
        success: false,
        message: "Email not found in whitelist",
      };
    }

    if (!existingEmail.is_active) {
      return {
        success: false,
        message: "Email is already deactivated",
      };
    }

    // Deactivate the email (soft delete) after revoking auth access
    await revokeAuthUserByEmail(normalizedEmail);

    const { error } = await supabase
      .from("email_whitelist")
      .update({ is_active: false, is_registered: false })
      .eq("email", normalizedEmail);

    if (error) {
      console.error("Error removing email from whitelist:", error);
      throw error;
    }

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

/**
 * Verify invitation token and return email if valid
 */
export async function verifyInvitationToken(
  token: string
): Promise<InvitationVerification> {
  try {
    const supabase = await createClient();

    // Find the invitation by token
    const { data, error } = await supabase
      .from("email_whitelist")
      .select("email, invitation_expires_at, is_registered")
      .eq("invitation_token", token)
      .eq("is_active", true)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return {
          isValid: false,
          message: "Invalid invitation token",
        };
      }
      throw error;
    }

    // Check if already registered
    if (data.is_registered) {
      return {
        isValid: false,
        message: "This invitation has already been used",
      };
    }

    // Check if token has expired
    const expiresAt = new Date(data.invitation_expires_at);
    const now = new Date();

    if (now > expiresAt) {
      return {
        isValid: false,
        message: "This invitation link has expired",
      };
    }

    return {
      isValid: true,
      email: data.email,
      message: "Valid invitation token",
    };
  } catch (error) {
    console.error("Error verifying invitation token:", error);
    return {
      isValid: false,
      message: "Error verifying invitation token",
    };
  }
}

/**
 * Mark invitation as used after successful registration
 */
export async function markInvitationAsUsed(token: string): Promise<boolean> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("email_whitelist")
      .update({ is_registered: true })
      .eq("invitation_token", token);

    if (error) {
      console.error("Error marking invitation as used:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Unexpected error marking invitation as used:", error);
    return false;
  }
}
