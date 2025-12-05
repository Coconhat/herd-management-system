"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Trash2, UserPlus, Shield, CheckCircle, XCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface WhitelistEmail {
  id: number;
  email: string;
  is_active: boolean;
  is_registered: boolean;
  notes: string | null;
  created_at: string;
}

export default function WhitelistAdminPage() {
  const [emails, setEmails] = useState<WhitelistEmail[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailToDelete, setEmailToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch whitelisted emails
  const fetchEmails = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/whitelist");
      if (response.ok) {
        const data = await response.json();
        setEmails(data);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch whitelisted emails",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching emails:", error);
      toast({
        title: "Error",
        description: "Failed to load whitelist",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  // Add email to whitelist
  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/whitelist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: newEmail,
          notes: notes || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: data.message,
        });
        setNewEmail("");
        setNotes("");
        fetchEmails(); // Refresh list
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error adding email:", error);
      toast({
        title: "Error",
        description: "Failed to add email to whitelist",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
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

      if (response.ok) {
        toast({
          title: "Success",
          description: data.message,
        });
        fetchEmails(); // Refresh list
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error removing email:", error);
      toast({
        title: "Error",
        description: "Failed to remove email from whitelist",
        variant: "destructive",
      });
    } finally {
      setEmailToDelete(null);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Email Whitelist Management</h1>
          <p className="text-muted-foreground">
            Control who can sign up for your farm management system
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add Email Form */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Add Email
            </CardTitle>
            <CardDescription>
              Add a new email address to the whitelist
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddEmail} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="e.g., Farm Manager, Veterinarian"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || !newEmail}
              >
                {isSubmitting ? "Adding..." : "Add to Whitelist"}
              </Button>
              <div className="text-xs text-muted-foreground mt-2 p-3 bg-muted rounded">
                <p className="font-semibold mb-1">How it works:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Add email here</li>
                  <li>Share signup page with user</li>
                  <li>User creates their own password</li>
                  <li>Done!</li>
                </ol>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Email List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Whitelisted Emails ({emails.length})</CardTitle>
            <CardDescription>Manage authorized email addresses</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading...
              </div>
            ) : emails.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No emails in whitelist. Add one to get started!
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Added</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {emails.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.email}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {item.is_registered ? (
                              <Badge
                                variant="outline"
                                className="gap-1 bg-green-50 text-green-700 border-green-200"
                              >
                                <CheckCircle className="h-3 w-3" />
                                Registered
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="gap-1">
                                Pending
                              </Badge>
                            )}
                            {!item.is_active && (
                              <Badge
                                variant="outline"
                                className="gap-1 bg-red-50 text-red-700 border-red-200"
                              >
                                <XCircle className="h-3 w-3" />
                                Inactive
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {item.notes || "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(item.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEmailToDelete(item.email)}
                            className="border-red-200 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 mr-1" /> Remove
                          </Button>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={emailToDelete !== null}
        onOpenChange={(open) => !open && setEmailToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Email from Whitelist?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately revoke access for{" "}
              <strong>{emailToDelete}</strong>. They will be signed out and must
              be re-added before they can log in again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => emailToDelete && handleRemoveEmail(emailToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
