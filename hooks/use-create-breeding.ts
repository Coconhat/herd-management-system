// hooks/use-create-breeding.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useCreateBreedingRecord() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch("/api/breeding", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to create breeding record");
      return res.json();
    },
    onSuccess: (_data, variables) => {
      // variables might include an animal_id field in the FormData.
      const animalId = Number(variables.get("animal_id"));
      // Invalidate listings that should be refreshed
      qc.invalidateQueries({ queryKey: ["animal-records", animalId] });
      qc.invalidateQueries({ queryKey: ["animals"] });
      qc.invalidateQueries({ queryKey: ["animal-stats"] }); // if you cache stats separately
    },
    onError: (err) => {
      console.error("create breeding error:", err);
    },
  });
}
