// app/inventory/animals/page.tsx (server)
import React from "react";

import {
  getAnimalStats,
  getAnimalsWithBreedingData,
} from "@/lib/actions/animals";
import { getCalvingsWithDetails } from "@/lib/actions/calvings";
import InventoryAnimalsPage from "@/components/inventory-animal-page";

export default async function Page() {
  // fetch server-side so the client receives populated arrays
  const animals = (await getAnimalsWithBreedingData()) || [];
  const calvings = (await getCalvingsWithDetails()) || [];
  const stats = await getAnimalStats();

  return (
    <InventoryAnimalsPage animals={animals} calvings={calvings} stats={stats} />
  );
}
