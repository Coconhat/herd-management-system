"use client";

import type React from "react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    if (password !== repeatPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      // Step 1: Check if email is whitelisted
      console.log("Step 1: Checking whitelist for:", email);
      const whitelistResponse = await fetch("/api/auth/check-whitelist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      console.log("Whitelist response status:", whitelistResponse.status);
      const whitelistText = await whitelistResponse.text();
      console.log("Whitelist raw response:", whitelistText.substring(0, 100));

      let whitelistData;
      try {
        whitelistData = JSON.parse(whitelistText);
      } catch (parseError) {
        throw new Error(
          `Whitelist check failed: ${whitelistText.substring(0, 100)}`
        );
      }

      if (!whitelistData.isWhitelisted) {
        setError(whitelistData.message || "This email is not authorized.");
        setIsLoading(false);
        return;
      }

      // Step 2: Create the account in Supabase Auth
      console.log("Step 2: Creating Supabase account for:", email);
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_SITE_URL || `${window.location.origin}/`,
        },
      });

      if (signUpError) {
        console.error("Signup error from Supabase:", signUpError);
        throw signUpError;
      }

      console.log("Account created successfully!");

      // Step 3: Mark email as registered in whitelist
      console.log("Marking email as registered:", email);
      const markResponse = await fetch("/api/auth/mark-registered", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      console.log("Mark registered response status:", markResponse.status);
      const responseText = await markResponse.text();
      console.log("Mark registered raw response:", responseText);

      try {
        const markResult = JSON.parse(responseText);
        console.log("Mark registered result:", markResult);
      } catch (parseError) {
        console.error("Failed to parse response as JSON:", parseError);
        console.error("Response was:", responseText.substring(0, 200));
        // Don't throw - allow signup to continue even if marking fails
      }

      // Success - redirect to success page
      router.push("/auth/sign-up-success");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground">
              Herd Management
            </h1>
            <p className="text-muted-foreground mt-2">
              Create your account to get started
            </p>
            <CardDescription>
              Notice: Only whitelisted emails can sign up.
            </CardDescription>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Sign up</CardTitle>
              <CardDescription>Create a new account</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignUp}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <div className="flex items-center">
                      <Label htmlFor="password">Password</Label>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <div className="flex items-center">
                      <Label htmlFor="repeat-password">Repeat Password</Label>
                    </div>
                    <Input
                      id="repeat-password"
                      type="password"
                      required
                      value={repeatPassword}
                      onChange={(e) => setRepeatPassword(e.target.value)}
                    />
                  </div>
                  {error && <p className="text-sm text-red-500">{error}</p>}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating account..." : "Sign up"}
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm">
                  Already have an account?{" "}
                  <Link
                    href="/auth/login"
                    className="underline underline-offset-4"
                  >
                    Login
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
