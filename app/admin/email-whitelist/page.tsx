"use client";

import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, Plus, Mail, Shield, Copy, ExternalLink } from "lucide-react";
import { format } from "date-fns";

interface WhitelistEntry {
  id: number;
  email: string;
  created_by: string | null;
  created_at: string;
  notes: string | null;
  is_active: boolean;
  invitation_token: string | null;
  invitation_expires_at: string | null;
  invitation_sent_at: string | null;
  is_registered: boolean;
}

export default function EmailWhitelistManager() {
  const [emails, setEmails] = useState<WhitelistEntry[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [createAccount, setCreateAccount] = useState(true); // Default to direct creation
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [showInvitationUrl, setShowInvitationUrl] = useState<string | null>(
    null
  );
  const [showCredentials, setShowCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const { toast } = useToast();

  // Fetch whitelisted emails
  const fetchEmails = async () => {
    try {
      const response = await fetch("/api/admin/whitelist");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch emails");
      }

      setEmails(data);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to load email whitelist",
        variant: "destructive",
      });
    } finally {
      setIsLoadingList(false);
    }
  };

  // Add email to whitelist or create account directly
  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/whitelist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: newEmail,
          notes: newNotes || null,
          createAccount: createAccount,
          password: newPassword || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to add email");
      }

      toast({
        title: "Success",
        description: data.message,
      });

      // Show credentials if account was created directly
      if (data.credentials) {
        setShowCredentials(data.credentials);
        setShowInvitationUrl(null); // Clear invitation URL
      }
      // Show invitation URL if provided (traditional method)
      else if (data.invitationUrl) {
        setShowInvitationUrl(data.invitationUrl);
        setShowCredentials(null); // Clear credentials
      }

      // Reset form and refresh list
      setNewEmail("");
      setNewNotes("");
      setNewPassword("");
      fetchEmails();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to add email to whitelist",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Remove email from whitelist
  const handleRemoveEmail = async (email: string) => {
    try {
      const response = await fetch("/api/admin/whitelist", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to remove email");
      }

      toast({
        title: "Success",
        description: data.message,
      });

      // Refresh list
      fetchEmails();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to remove email from whitelist",
        variant: "destructive",
      });
    }
  };

  // Copy invitation URL to clipboard
  const copyInvitationUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Copied!",
        description: "Invitation URL copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy URL to clipboard",
        variant: "destructive",
      });
    }
  };

  // Generate invitation URL for existing email
  const generateInvitationUrl = (token: string) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/auth/invite?token=${token}`;
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold">Email Whitelist Management</h1>
      </div>

      <div className="grid gap-6">
        {/* Invitation URL Display */}
        {showInvitationUrl && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <Mail className="h-5 w-5" />
                Invitation Link Generated
              </CardTitle>
              <CardDescription className="text-green-700">
                Share this link with the user to complete their registration.
                The link expires in 7 days.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 p-3 bg-white rounded-md border">
                <Input
                  value={showInvitationUrl}
                  readOnly
                  className="flex-1 text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyInvitationUrl(showInvitationUrl)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(showInvitationUrl, "_blank")}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowInvitationUrl(null)}
                className="mt-2"
              >
                Dismiss
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Credentials Display */}
        {showCredentials && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Shield className="h-5 w-5" />
                Account Created Successfully
              </CardTitle>
              <CardDescription className="text-blue-700">
                User account has been created. Share these credentials with the
                user for login.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-white rounded-md border">
                  <Label className="w-16 text-sm font-medium">Email:</Label>
                  <Input
                    value={showCredentials.email}
                    readOnly
                    className="flex-1 text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyInvitationUrl(showCredentials.email)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 p-3 bg-white rounded-md border">
                  <Label className="w-16 text-sm font-medium">Password:</Label>
                  <Input
                    value={showCredentials.password}
                    readOnly
                    className="flex-1 text-sm font-mono"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyInvitationUrl(showCredentials.password)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCredentials(null)}
                className="mt-3"
              >
                Dismiss
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Add Email Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New User
            </CardTitle>
            <CardDescription>
              {createAccount
                ? "Create a user account directly with login credentials."
                : "Add an email to whitelist and generate an invitation link."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddEmail} className="space-y-4">
              {/* Account Creation Method */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="createAccount"
                  checked={createAccount}
                  onCheckedChange={(checked) => setCreateAccount(!!checked)}
                />
                <Label
                  htmlFor="createAccount"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Create account directly (recommended)
                </Label>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>

              {/* Password field - only show when creating account directly */}
              {createAccount && (
                <div className="grid gap-2">
                  <Label htmlFor="password">Password (Optional)</Label>
                  <Input
                    id="password"
                    type="text"
                    placeholder="Leave blank to auto-generate secure password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    If left blank, a secure 12-character password will be
                    generated automatically.
                  </p>
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Purpose or notes about this user..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <Button type="submit" disabled={isLoading}>
                {isLoading
                  ? "Processing..."
                  : createAccount
                  ? "Create Account with Credentials"
                  : "Add Email & Generate Invitation"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Email List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Whitelisted Emails ({
                emails.filter((e) => e.is_active).length
              }{" "}
              active)
            </CardTitle>
            <CardDescription>
              Manage authorized email addresses and their invitation status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingList ? (
              <div className="text-center py-4">Loading...</div>
            ) : emails.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No emails in whitelist. Add some emails to get started.
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Registration</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Added Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {emails.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">
                          {entry.email}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={entry.is_active ? "default" : "secondary"}
                          >
                            {entry.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge
                              variant={
                                entry.is_registered ? "default" : "outline"
                              }
                              className={
                                entry.is_registered
                                  ? "bg-green-100 text-green-800"
                                  : ""
                              }
                            >
                              {entry.is_registered ? "Registered" : "Pending"}
                            </Badge>
                            {entry.invitation_token && !entry.is_registered && (
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-xs"
                                  onClick={() =>
                                    copyInvitationUrl(
                                      generateInvitationUrl(
                                        entry.invitation_token!
                                      )
                                    )
                                  }
                                >
                                  <Copy className="h-3 w-3 mr-1" />
                                  Copy Link
                                </Button>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {entry.notes || "-"}
                        </TableCell>
                        <TableCell>
                          {format(new Date(entry.created_at), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          {entry.is_active && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Remove Email from Whitelist
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to remove "
                                    {entry.email}" from the whitelist? This will
                                    prevent this email address from creating new
                                    accounts.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      handleRemoveEmail(entry.email)
                                    }
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Remove
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
