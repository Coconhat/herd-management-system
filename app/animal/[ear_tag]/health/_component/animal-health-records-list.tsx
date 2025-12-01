"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";

export default function HealthRecordList({ records }: { records: any[] }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  const handleOpen = (rec: any) => {
    setSelected(rec);
    setOpen(true);
  };

  if (!records.length) {
    return <p className="text-muted-foreground">No health records found.</p>;
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {records.map((rec) => (
          <Card
            key={rec.id}
            className="border cursor-pointer hover:shadow-md transition"
            onClick={() => handleOpen(rec)}
          >
            <CardContent className="p-4 space-y-2">
              <div className="flex justify-between">
                <p className="font-semibold">{rec.record_type}</p>
                <p className="text-sm text-gray-500">
                  {format(new Date(rec.record_date), "MMM dd, yyyy")}
                </p>
              </div>

              {rec.description && (
                <p className="text-sm text-gray-700 line-clamp-2">
                  {rec.description}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* DIALOG */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {selected.record_type} —{" "}
                  {format(new Date(selected.record_date), "MMM dd, yyyy")}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 text-sm">
                {selected.description && (
                  <>
                    <p>{selected.description}</p>
                    <Separator />
                  </>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <p>
                    <strong>Treatment:</strong> {selected.treatment || "—"}
                  </p>
                  <p>
                    <strong>Veterinarian:</strong>{" "}
                    {selected.veterinarian || "—"}
                  </p>
                  <p>
                    <strong>Syringes Used:</strong> {selected.syringes_used}
                  </p>
                  <p>
                    <strong>Syringe Type:</strong>{" "}
                    {selected.syringe_type || "—"}
                  </p>
                  <p className="col-span-2">
                    <strong>Notes:</strong> {selected.notes || "—"}
                  </p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
