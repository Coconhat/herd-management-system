"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Query keys
export const animalKeys = {
  all: ["animals"] as const,
  lists: () => [...animalKeys.all, "list"] as const,
  list: (filters = {}) => [...animalKeys.lists(), { ...filters }] as const,
  details: () => [...animalKeys.all, "detail"] as const,
  detail: (id: number | string) => [...animalKeys.details(), id] as const,
};

export const animalRecordKeys = {
  records: (animalId: number) => ["animal-records", animalId] as const,
};

// Fetcher for combined records (calls /api/animal-records?animalId=)
async function fetchAnimalRecords(animalId: number) {
  const res = await fetch(`/api/animal-records?animalId=${animalId}`);
  if (!res.ok) throw new Error("Failed to load animal records");
  return res.json();
}

// Hook: combined records
export function useAnimalRecordsCombined(animalId?: number) {
  return useQuery({
    queryKey: animalRecordKeys.records(Number(animalId)),
    queryFn: () => fetchAnimalRecords(Number(animalId)),
    enabled: !!animalId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

// Hook: animals list (calls your server route or existing getAnimals endpoint)
export function useAnimalsList() {
  return useQuery({
    queryKey: animalKeys.lists(),
    queryFn: async () => {
      const res = await fetch("/api/animals"); // create this route (see note below)
      if (!res.ok) throw new Error("Failed to load animals");
      return res.json();
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: false,
  });
}
