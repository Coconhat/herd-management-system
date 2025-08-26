import { ImportCard } from "@/app/upload/_components/import-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export default function ImportPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Bulk Import Center
        </h1>
        <p className="text-muted-foreground">
          Import animals and their calving history from an XLSX file.
        </p>
      </div>

      <ImportCard />

      <Alert variant="default">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Instructions & Template</AlertTitle>
        <AlertDescription className="space-y-2 mt-2">
          <p>
            1. <strong>Download the template file.</strong> A template is
            required to match the columns correctly. A link to download is on
            the import card.
          </p>
          <p>
            2. <strong>Fill out the template.</strong> The sheet must be named
            `Animals`. Each row represents one animal. Calves must be listed
            *after* their parents in the file.
          </p>
          <p>
            3. <strong>Required Columns:</strong> `ear_tag` and `sex` are
            mandatory for all animals.
          </p>
          <p>
            4. <strong>Upload the file.</strong> Existing animals with the same
            ear tag will be skipped.
          </p>
        </AlertDescription>
      </Alert>
    </div>
  );
}
