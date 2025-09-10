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
import { Trash2, Plus, Mail, Shield } from "lucide-react";
import { format } from "date-fns";

interface WhitelistEntry {
  id: number;
  email: string;
  created_by: string | null;
  created_at: string;
  notes: string | null;
  is_active: boolean;
}

export default function EmailWhitelistManager() {
  const [emails, setEmails] = useState<WhitelistEntry[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(true);
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

  // Add email to whitelist
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

      // Reset form and refresh list
      setNewEmail("");
      setNewNotes("");
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
        {/* Add Email Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Email
            </CardTitle>
            <CardDescription>
              Add an email address to allow account creation. Only whitelisted
              emails can register.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddEmail} className="space-y-4">
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
                {isLoading ? "Adding..." : "Add Email"}
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
              Manage authorized email addresses for account registration.
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
