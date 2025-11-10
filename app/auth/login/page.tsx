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
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<
    { kind: "success"; text: string } | { kind: "error"; text: string } | null
  >(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      router.push("/");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setResetMessage({
        kind: "error",
        text: "Enter your email address first.",
      });
      return;
    }

    const supabase = createClient();
    setIsResetting(true);
    setResetMessage(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });

      if (error) throw error;

      setResetMessage({
        kind: "success",
        text: "Check your inbox for a password reset link.",
      });
    } catch (error: unknown) {
      setResetMessage({
        kind: "error",
        text:
          error instanceof Error
            ? error.message
            : "Failed to send reset email. Try again.",
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="text-center">
            <div>
              <Image
                src="/farm-logo.jpg"
                alt="Logo"
                width={100}
                height={100}
                className="mx-auto rounded-full"
              />
            </div>
            <h1 className="text-3xl font-bold text-foreground">
              D.H MAGPANTAY
            </h1>
            <p>Dairy Farm</p>
            <p className="text-muted-foreground mt-2">
              Sign in to manage your cattle
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Login</CardTitle>
              <CardDescription>
                Enter your email below to login to your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin}>
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
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={handlePasswordReset}
                      className="self-end text-xs font-medium text-primary underline-offset-4 hover:underline disabled:opacity-50"
                      disabled={isResetting}
                    >
                      {isResetting ? "Sending..." : "Forgot password?"}
                    </button>
                  </div>
                  {error && <p className="text-sm text-red-500">{error}</p>}
                  {resetMessage && (
                    <p
                      className={`text-xs ${
                        resetMessage.kind === "success"
                          ? "text-green-600"
                          : "text-red-500"
                      }`}
                    >
                      {resetMessage.text}
                    </p>
                  )}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Logging in..." : "Login"}
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm">
                  Don&apos;t have an account?{" "}
                  <Link
                    href="/auth/sign-up"
                    className="underline underline-offset-4"
                  >
                    Sign up
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
