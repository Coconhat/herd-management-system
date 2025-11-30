"use client";

import React, { useState } from "react";
import HealthRecordModal from "@/components/health-record-modal";
import { Button } from "@/components/ui/button";
import type { Animal } from "@/lib/actions/animals";

export default function HealthPageClient({ animals }: { animals: Animal[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <div className="mb-4">
        <Button onClick={() => setOpen(true)}>Add Health Record</Button>
      </div>

      <HealthRecordModal open={open} onOpenChange={setOpen} animals={animals} />
    </div>
  );
}
