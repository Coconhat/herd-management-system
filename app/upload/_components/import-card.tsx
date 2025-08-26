"use client";

import { useState, useTransition } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { FileDown, Terminal, UploadCloud } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { structuredImportAction } from "@/lib/actions/import"; // We will create this new action

export function ImportCard() {
  const [file, setFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{
    success: number;
    skipped: number;
    errors: string[];
  } | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleImport = () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please choose an XLSX file.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array", cellDates: true });

        // ✨ We now pass the sheet names and the raw sheet data (as JSON of arrays)
        const sheetsData = workbook.SheetNames.map((name) => ({
          sheetName: name,
          data: XLSX.utils.sheet_to_json(workbook.Sheets[name], {
            header: 1,
            raw: false,
          }), // header: 1 converts to 2D array
        }));

        startTransition(async () => {
          const importResult = await structuredImportAction(sheetsData);
          setResult(importResult);
          toast({
            title: "Import Complete",
            description: `${importResult.success} animals processed.`,
          });
        });
      } catch (error) {
        toast({
          title: "Import Error",
          description:
            error instanceof Error ? error.message : "Could not process file.",
          variant: "destructive",
        });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Animal Records File</CardTitle>
        <CardDescription>temporary closed for maintenance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <Input
            id="file-upload"
            type="file"
            accept=".xlsx"
            onChange={handleFileChange}
            className="max-w-xs"
            disabled
          />
          <Button onClick={handleImport} disabled={!file || isPending}>
            <UploadCloud className="mr-2 h-4 w-4" />
            {isPending ? "Processing..." : "Upload & Process File"}
          </Button>
          {/* The download link can point to a sample template if you have one */}
          {/* <Button asChild variant="secondary"><Link href="/animal_record_template.xlsx" download><FileDown className="h-4 w-4" /></Link></Button> */}
        </div>

        {result && (
          <Alert>
            <Terminal className="h-4 w-4" />
            <AlertTitle>Import Results</AlertTitle>
            <AlertDescription className="mt-2 text-sm max-h-48 overflow-y-auto">
              <p>
                <strong>Successfully Created:</strong> {result.success}
              </p>
              <p>
                <strong>Skipped (Already Exists):</strong> {result.skipped}
              </p>
              {result.errors.length > 0 && (
                <div className="mt-2">
                  <p className="font-semibold text-destructive">
                    Errors Encountered:
                  </p>
                  <ul className="list-disc list-inside text-xs text-destructive">
                    {result.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
