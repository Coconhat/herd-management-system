"use server";

import { redirect } from "next/navigation";
import { createClient } from "../supabase/server";

type FeedRow = {
  id: string;
  event_date: string;
  feeds: number;
  reference: string | null;
  recorded_by: string | null;
};

export type FeedMovementType = "addition" | "consumption";

export type Feeds = FeedRow & {
  type: FeedMovementType;
};

export type AddFeedsInput = {
  event_date: string;
  feeds: number;
  type: FeedMovementType;
  reference?: string;
  recorded_by?: string;
};

async function getFeed(): Promise<Feeds[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data, error } = await supabase
    .from("feeds")
    .select("id, event_date, feeds, reference, recorded_by")
    .order("event_date", { ascending: false });

  if (error) {
    console.error("Error fetching feed data:", error);
    throw new Error(error.message);
  }

  if (!data) {
    return [];
  }

  return (data as FeedRow[]).map((row) => ({
    ...row,
    type: row.feeds < 0 ? "consumption" : "addition",
  }));
}

async function addFeed({
  event_date,
  feeds,
  type,
  reference,
  recorded_by,
}: AddFeedsInput): Promise<Feeds> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const parsedFeeds = Number(feeds);
  if (Number.isNaN(parsedFeeds)) {
    throw new Error("Invalid feeds value");
  }

  const normalizedFeeds =
    type === "consumption" ? -Math.abs(parsedFeeds) : Math.abs(parsedFeeds);

  if (!event_date) {
    throw new Error("event_date is required");
  }

  const feedData = {
    event_date,
    feeds: normalizedFeeds,
    reference: reference?.trim() || null,
    recorded_by: recorded_by?.trim() || null,
  };

  const { data, error } = await supabase
    .from("feeds")
    .insert([feedData])
    .select("id, event_date, feeds, reference, recorded_by")
    .single();

  if (error) {
    console.error("Error adding feed data:", error);
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("No feed data returned after insert");
  }

  return {
    ...data,
    type: data.feeds < 0 ? "consumption" : "addition",
  };
}

export { getFeed, addFeed };
