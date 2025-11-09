"use client";
import { Button } from "@/components/ui/button";
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
import { addFeed, Feeds, getFeed } from "@/lib/actions/feed";
import Link from "next/link";

import { FormEvent, useEffect, useMemo, useState } from "react";

type FeedMovementType = "addition" | "consumption";

type FeedModalFormValues = {
  event_date: string;
  feeds: number;
  type: FeedMovementType;
  reference?: string;
  recorded_by?: string;
};

type FeedModalProps = {
  open: boolean;
  mode?: "create" | "update";
  submitting?: boolean;
  initialValues?: Partial<FeedModalFormValues>;
  onClose?: () => void;
  onSubmit?: (values: FeedModalFormValues) => Promise<void> | void;
  onDelete?: () => void;
};

const historyColumns = [
  "Date",
  "Change",
  "Quantity",
  "Reference",
  "Recorded By",
];

const movementLabels: Record<FeedMovementType, string> = {
  addition: "Restock",
  consumption: "Consumption",
};

const AVERAGE_WINDOW_DAYS = 7;

export default function FeedInventoryPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedEntries, setFeedEntries] = useState<Feeds[] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { currentStock, averageDailyUsage } = useMemo(() => {
    if (!feedEntries || feedEntries.length === 0) {
      return { currentStock: 0, averageDailyUsage: 0 };
    }

    const totalStock = feedEntries.reduce((acc, entry) => acc + entry.feeds, 0);

    const now = Date.now();
    const windowMs = AVERAGE_WINDOW_DAYS * 24 * 60 * 60 * 1000;
    const cutoff = now - windowMs;

    const usageTotal = feedEntries.reduce((acc, entry) => {
      const entryTime = new Date(entry.event_date).getTime();
      if (entryTime >= cutoff && entry.feeds < 0) {
        return acc + Math.abs(entry.feeds);
      }
      return acc;
    }, 0);

    return {
      currentStock: totalStock,
      averageDailyUsage: usageTotal / AVERAGE_WINDOW_DAYS,
    };
  }, [feedEntries]);

  const formatQuantity = (value: number) =>
    new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 2,
    }).format(value);

  const overviewCards = [
    {
      title: "Current Feed Stock",
      metric: `${formatQuantity(currentStock)} kg`,
      description: "Available feed across storage locations.",
    },

    {
      title: "Average Daily Usage",
      metric: `${formatQuantity(averageDailyUsage)} kg`,
      description: `Average consumption over the last ${AVERAGE_WINDOW_DAYS} days.`,
    },
  ];

  useEffect(() => {
    async function fetchFeed() {
      const res = await getFeed();
      setFeedEntries(res);
    }
    fetchFeed();
  }, []);

  const handleCreateFeed = async (values: FeedModalFormValues) => {
    try {
      setIsSubmitting(true);
      await addFeed(values);
      const refreshed = await getFeed();
      setFeedEntries(refreshed);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to log feed movement", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to log feed movement. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPHDate = (iso: string) => {
    return new Intl.DateTimeFormat("en-PH", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    }).format(new Date(iso));
  };
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 rounded-3xl border border-emerald-100/70 bg-emerald-50/40 px-6 py-10 shadow-sm">
      <Link
        href="/"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        ← Back to Home
      </Link>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
        {overviewCards.map((card) => (
          <Card
            key={card.title}
            className="border-none bg-gradient-to-br from-emerald-100/70 via-emerald-50/80 to-white/90 shadow-md"
          >
            <CardHeader className="pb-2 text-emerald-900">
              <CardTitle className="text-emerald-900">{card.title}</CardTitle>
              <CardDescription className="text-emerald-700/80">
                {card.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-3xl font-semibold tracking-tight text-emerald-900">
                {card.metric}
              </span>
            </CardContent>
          </Card>
        ))}
      </section>

      <div>
        <Button
          className="bg-emerald-500 text-emerald-950 hover:bg-emerald-600"
          onClick={() => setIsModalOpen(!isModalOpen)}
        >
          Log Feed Movement
        </Button>
      </div>

      <section className="rounded-2xl border border-emerald-200/70 bg-white/70 shadow-sm">
        <header className="flex items-center justify-between gap-4 border-b border-emerald-100/70 bg-emerald-50/80 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Feed Movement History
            </h2>
            <p className="text-muted-foreground text-sm">
              Review every restock, consumption, or adjustment logged for feed
              inventory.
            </p>
          </div>
        </header>
        <div className="px-6 py-4">
          <Table className="[&_tbody_tr:nth-child(even)]:bg-emerald-50/40">
            <TableHeader className="bg-emerald-100/80 text-emerald-900">
              <TableRow>
                {historyColumns.map((column) => (
                  <TableHead key={column} className="text-emerald-900">
                    {column}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {feedEntries?.map((entry) => (
                <TableRow key={entry.id} className="border-emerald-100/60">
                  <TableCell className="text-muted-foreground">
                    {formatPHDate(entry.event_date)}
                  </TableCell>
                  <TableCell className="text-emerald-900">
                    {movementLabels[entry.type as FeedMovementType] ??
                      entry.type}
                  </TableCell>
                  <TableCell className="text-emerald-900">
                    {Math.abs(entry.feeds)} kg
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {entry.reference || "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {entry.recorded_by || "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      {isModalOpen && (
        <FeedModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          submitting={isSubmitting}
          onSubmit={handleCreateFeed}
        />
      )}
    </div>
  );
}
function FeedModal({
  open,
  mode = "create",
  submitting = false,
  initialValues,
  onClose,
  onSubmit,
  onDelete,
}: FeedModalProps) {
  if (!open) return null;

  const title =
    mode === "update" ? "Update Feed Movement" : "Log Feed Movement";
  const description =
    mode === "update"
      ? "Modify the recorded details for this feed movement."
      : "Track a new feed restock or consumption.";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    const payload: FeedModalFormValues = {
      event_date: (formData.get("event_date") as string) || "",
      feeds: Number(formData.get("feeds")) || 0,
      type: (formData.get("type") as FeedMovementType) || "addition",
      reference: (formData.get("reference") as string) || "",
      recorded_by: (formData.get("recorded_by") as string) || "",
    };

    await onSubmit?.(payload);

    if (mode === "create") {
      form.reset();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-emerald-200/70 bg-white p-6 shadow-2xl">
        <header className="mb-4 space-y-1 text-emerald-900">
          <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
          <p className="text-sm text-emerald-700/80">{description}</p>
        </header>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm font-medium text-emerald-900">
              Date
              <input
                name="event_date"
                type="date"
                required
                defaultValue={initialValues?.event_date}
                className="rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-emerald-900">
              Quantity (kg)
              <input
                name="feeds"
                type="number"
                required
                step="0.01"
                min="0"
                defaultValue={
                  initialValues?.feeds !== undefined
                    ? String(initialValues.feeds)
                    : ""
                }
                className="rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-emerald-900">
              Adjustment Type
              <select
                name="type"
                defaultValue={initialValues?.type || "addition"}
                className="rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <option value="addition">Restock</option>
                <option value="consumption">Consumption</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-emerald-900">
              Reference
              <input
                name="reference"
                placeholder="e.g. Delivery #1023"
                defaultValue={initialValues?.reference}
                className="rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1 text-sm font-medium text-emerald-900">
            Recorded By
            <input
              name="recorded_by"
              placeholder="Name of operator"
              defaultValue={initialValues?.recorded_by}
              className="rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </label>

          <footer className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {mode === "update" && onDelete ? (
              <Button
                type="button"
                variant="destructive"
                onClick={onDelete}
                disabled={submitting}
              >
                Delete Record
              </Button>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={submitting}
                className="border-emerald-200 text-emerald-800 "
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-emerald-500 text-emerald-950 hover:bg-emerald-600"
                disabled={submitting}
              >
                {submitting
                  ? "Saving..."
                  : mode === "update"
                  ? "Save Changes"
                  : "Log Movement"}
              </Button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
}
