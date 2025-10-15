"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import {
  Download,
  FileText,
  Printer,
  FileSpreadsheet,
  BarChart3,
  Calendar,
  Loader2,
} from "lucide-react";
import {
  exportToPDF,
  printElement,
  exportToCSV,
  exportQuarterlyReport,
  generateComprehensivePrintData,
  type ExportData,
} from "./export-utils";
import { ComprehensivePrintView } from "./comprehensive-print-view";
import { createPortal } from "react-dom";
import { format } from "date-fns";

interface ExportToolbarProps {
  data: ExportData;
  elementId: string;
  title?: string;
  enableComprehensivePrint?: boolean;
}

export function ExportToolbar({
  data,
  elementId,
  title = "Milking Records",
  enableComprehensivePrint = false,
}: ExportToolbarProps) {
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [showComprehensiveView, setShowComprehensiveView] = useState(false);
  const { toast } = useToast();

  const handleExport = async (
    type:
      | "pdf"
      | "print"
      | "csv"
      | "quarterly"
      | "comprehensive-print"
      | "comprehensive-pdf"
  ) => {
    setIsExporting(type);

    try {
      switch (type) {
        case "pdf":
          // Wait a bit for any dynamic content to render
          setTimeout(async () => {
            try {
              const pdfFilename = `${title
                .toLowerCase()
                .replace(/\s+/g, "_")}_${format(new Date(), "yyyy-MM-dd")}.pdf`;
              await exportToPDF(elementId, pdfFilename);
              toast({
                title: "PDF Generated",
                description: `Successfully exported ${title} to PDF`,
              });
            } catch (error) {
              console.error("PDF export error:", error);
              toast({
                title: "PDF Export Failed",
                description:
                  error instanceof Error
                    ? error.message
                    : "Failed to generate PDF",
                variant: "destructive",
              });
            } finally {
              setIsExporting(null);
            }
          }, 100);
          return; // Don't set isExporting to null immediately

        case "print":
          printElement(elementId);
          toast({
            title: "Print Dialog Opened",
            description: "Print dialog has been opened in a new window",
          });
          break;

        case "comprehensive-print":
          const comprehensiveId = `comprehensive-print-${Date.now()}`;
          setShowComprehensiveView(true);

          // Wait for the component to render
          setTimeout(() => {
            printElement(comprehensiveId);
            setShowComprehensiveView(false);
            toast({
              title: "Comprehensive Print Opened",
              description: "Complete production history print dialog opened",
            });
          }, 500);
          break;

        case "comprehensive-pdf":
          const comprehensivePdfId = `comprehensive-pdf-${Date.now()}`;
          setShowComprehensiveView(true);

          // Wait for the component to render then generate PDF
          setTimeout(async () => {
            try {
              const pdfFilename = `comprehensive_milking_report_${format(
                new Date(),
                "yyyy-MM-dd"
              )}.pdf`;
              await exportToPDF(comprehensivePdfId, pdfFilename);
              toast({
                title: "Comprehensive PDF Generated",
                description: "Complete production history exported to PDF",
              });
            } catch (error) {
              toast({
                title: "PDF Export Failed",
                description:
                  error instanceof Error
                    ? error.message
                    : "Failed to generate comprehensive PDF",
                variant: "destructive",
              });
            } finally {
              setShowComprehensiveView(false);
            }
          }, 1000);
          break;

        case "csv":
          exportToCSV(data);
          toast({
            title: "CSV Downloaded",
            description: "Successfully exported data to CSV file",
          });
          break;

        case "quarterly":
          await exportQuarterlyReport(data);
          toast({
            title: "Quarterly Report Generated",
            description: "Successfully generated quarterly PDF report",
          });
          break;
      }
    } catch (error) {
      console.error(`Error during ${type} export:`, error);
      toast({
        title: "Export Failed",
        description:
          error instanceof Error ? error.message : `Failed to export ${type}`,
        variant: "destructive",
      });
    } finally {
      if (type !== "pdf") {
        // PDF handling is done in setTimeout
        setIsExporting(null);
      }
    }
  };

  const isLoading = (type: string) => isExporting === type;

  return (
    <>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={!!isExporting}>
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Export Options</DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => handleExport("csv")}
              disabled={isLoading("csv")}
              className="cursor-pointer"
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              {isLoading("csv") ? "Generating CSV..." : "Export as CSV"}
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => handleExport("print")}
              disabled={isLoading("print")}
              className="cursor-pointer"
            >
              <Printer className="mr-2 h-4 w-4" />
              {isLoading("print") ? "Opening Print..." : "Print Current View"}
            </DropdownMenuItem>

            {enableComprehensivePrint && (
              <>
                <DropdownMenuItem
                  onClick={() => handleExport("comprehensive-print")}
                  disabled={isLoading("comprehensive-print")}
                  className="cursor-pointer"
                >
                  <Printer className="mr-2 h-4 w-4" />
                  {isLoading("comprehensive-print")
                    ? "Preparing..."
                    : "Print All Records"}
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => handleExport("comprehensive-pdf")}
                  disabled={isLoading("comprehensive-pdf")}
                  className="cursor-pointer"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  {isLoading("comprehensive-pdf")
                    ? "Generating..."
                    : "Complete PDF Report"}
                </DropdownMenuItem>
              </>
            )}

            {data.viewMode === "analytics" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleExport("quarterly")}
                  disabled={isLoading("quarterly")}
                  className="cursor-pointer"
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  {isLoading("quarterly")
                    ? "Generating Report..."
                    : "Quarterly Report (PDF)"}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Quick action buttons */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleExport("print")}
          disabled={isLoading("print")}
          className="hidden sm:flex"
        >
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
      </div>

      {/* Comprehensive Print View - Hidden but rendered for printing */}
      {showComprehensiveView &&
        typeof window !== "undefined" &&
        createPortal(
          <ComprehensivePrintView
            records={data.records}
            animals={data.animals}
            id={`comprehensive-${Date.now()}`}
          />,
          document.body
        )}
    </>
  );
}

interface PrintableWrapperProps {
  children: React.ReactNode;
  id: string;
  title: string;
  subtitle?: string;
}

export function PrintableWrapper({
  children,
  id,
  title,
  subtitle,
}: PrintableWrapperProps) {
  return (
    <div id={id} className="print:p-4">
      {/* Print header - only visible when printing */}
      <div className="hidden print:block print:mb-4">
        <div className="text-center border-b pb-2 mb-4">
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle && <p className="text-lg text-gray-600">{subtitle}</p>}
          <p className="text-sm text-gray-500 mt-2">
            Generated on {format(new Date(), "MMMM d, yyyy 'at' h:mm a")}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="print:text-sm">{children}</div>

      {/* Print footer - only visible when printing */}
      <div className="hidden print:block print:mt-4 print:pt-2 print:border-t">
        <div className="text-center text-xs text-gray-500">
          <p>Calving Management System - Milk Production Report</p>
          <p>Page generated automatically - Please verify data accuracy</p>
        </div>
      </div>
    </div>
  );
}
