"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TestWhitelistPage() {
  const [email, setEmail] = useState("nhatvusell@gmail.com");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testCheckWhitelist = async () => {
    setResult(null);
    setError(null);
    try {
      const response = await fetch("/api/auth/check-whitelist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const text = await response.text();
      console.log("Raw response:", text);

      try {
        const data = JSON.parse(text);
        setResult(data);
      } catch (e) {
        setError(`Not JSON! Response: ${text.substring(0, 500)}`);
      }
    } catch (e: any) {
      setError(e.message);
    }
  };

  const testMarkRegistered = async () => {
    setResult(null);
    setError(null);
    try {
      const response = await fetch("/api/auth/mark-registered", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const text = await response.text();
      console.log("Raw response:", text);

      try {
        const data = JSON.parse(text);
        setResult(data);
      } catch (e) {
        setError(`Not JSON! Response: ${text.substring(0, 500)}`);
      }
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Test Whitelist API Endpoints</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Test Email:
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email to test"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={testCheckWhitelist}>Test Check Whitelist</Button>
            <Button onClick={testMarkRegistered} variant="secondary">
              Test Mark Registered
            </Button>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded">
              <h3 className="font-bold text-red-800">Error:</h3>
              <pre className="text-sm text-red-600 whitespace-pre-wrap">
                {error}
              </pre>
            </div>
          )}

          {result && (
            <div className="p-4 bg-green-50 border border-green-200 rounded">
              <h3 className="font-bold text-green-800">Success:</h3>
              <pre className="text-sm text-green-600">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
