// app/inventory/animals/page.tsx (server)
import React from "react";

import { getAnimals, getAnimalStats } from "@/lib/actions/animals";
import {
  getCalvingsWithDetails,
  getPregnantAnimals,
} from "@/lib/actions/calvings";
import InventoryAnimalsPage from "@/components/inventory-animal-page";

export default async function Page() {
  // fetch server-side so the client receives populated arrays
  const animals = (await getAnimals()) || [];
  const calvings = (await getCalvingsWithDetails()) || [];
  const stats = await getAnimalStats();
  const pregnantAnimals = await getPregnantAnimals();

  return (
    <InventoryAnimalsPage
      animals={animals}
      calvings={calvings}
      stats={stats}
      pregnantAnimals={pregnantAnimals}
    />
  );
}
