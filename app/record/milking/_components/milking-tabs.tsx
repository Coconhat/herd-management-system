"use client";

import { useState } from "react";
import { MilkingRecordsTable } from "./milking-records-table";
import { QuarterlyCharts } from "./quarterly-charts";
import { ExportToolbar, PrintableWrapper } from "./export-toolbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MilkingRecord } from "@/lib/types";
import { Animal } from "@/lib/actions/animals";
import { TableIcon, Calendar, BarChart3 } from "lucide-react";
import type { ExportData } from "./export-utils";

// Define animal with milking records type
type AnimalWithMilkingRecords = Animal & {
  milking_records?: MilkingRecord[];
};

interface MilkingTabsProps {
  sortedRecords: MilkingRecord[];
  allMilkingRecords: MilkingRecord[];
  animals: AnimalWithMilkingRecords[];
}

export function MilkingTabs({
  sortedRecords,
  allMilkingRecords,
  animals,
}: MilkingTabsProps) {
  const [activeTab, setActiveTab] = useState("excel");
  const [selectedWeek, setSelectedWeek] = useState<Date>(new Date());
  const [selectedQuarter, setSelectedQuarter] = useState<Date>(new Date());

  // Create export data based on current tab
  const getExportData = (viewMode: ExportData["viewMode"]): ExportData => ({
    records: viewMode === "analytics" ? allMilkingRecords : sortedRecords,
    animals,
    selectedWeek,
    selectedQuarter,
    viewMode,
  });

  const getElementId = () => {
    switch (activeTab) {
      case "excel":
        return "excel-view-export";
      case "all":
        return "all-records-export";
      case "by-animal":
        return "by-animal-export";
      case "analytics":
        return "analytics-export";
      default:
        return "milking-export";
    }
  };

  const getTitle = () => {
    switch (activeTab) {
      case "excel":
        return "Weekly Milk Production";
      case "all":
        return "All Milking Records";
      case "by-animal":
        return "Milking Records by Animal";
      case "analytics":
        return "Quarterly Production Analytics";
      default:
        return "Milk Production Records";
    }
  };

  const getSubtitle = () => {
    switch (activeTab) {
      case "excel":
        return `Week of ${selectedWeek.toLocaleDateString()}`;
      case "analytics":
        return `Q${Math.ceil(
          (selectedQuarter.getMonth() + 1) / 3
        )} ${selectedQuarter.getFullYear()}`;
      default:
        return undefined;
    }
  };

  return (
    <div className="space-y-4">
      {/* Export toolbar */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Production History</h2>
        <ExportToolbar
          data={getExportData(activeTab as ExportData["viewMode"])}
          elementId={getElementId()}
          title={getTitle()}
        />
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="excel">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1">
          <TabsTrigger
            value="excel"
            className="flex items-center gap-1 text-xs sm:text-sm"
          >
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Excel View</span>
            <span className="xs:hidden">Excel</span>
          </TabsTrigger>
          <TabsTrigger
            value="all"
            className="flex items-center gap-1 text-xs sm:text-sm"
          >
            <TableIcon className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">All Records</span>
            <span className="xs:hidden">All</span>
          </TabsTrigger>
          <TabsTrigger value="by-animal" className="text-xs sm:text-sm">
            <span className="hidden xs:inline">By Animal</span>
            <span className="xs:hidden">Animal</span>
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="flex items-center gap-1 text-xs sm:text-sm"
          >
            <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Analytics</span>
            <span className="xs:hidden">Charts</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="excel" className="pt-4">
          <PrintableWrapper
            id="excel-view-export"
            title="Weekly Milk Production"
            subtitle={`Week of ${selectedWeek.toLocaleDateString()}`}
          >
            <MilkingRecordsTable
              records={sortedRecords}
              animals={animals}
              viewMode="excel"
              onWeekChange={setSelectedWeek}
              selectedWeek={selectedWeek}
            />
          </PrintableWrapper>
        </TabsContent>

        <TabsContent value="all" className="pt-4">
          <PrintableWrapper id="all-records-export" title="All Milking Records">
            <MilkingRecordsTable
              records={sortedRecords}
              animals={animals}
              viewMode="table"
            />
          </PrintableWrapper>
        </TabsContent>

        <TabsContent value="by-animal" className="pt-4">
          <PrintableWrapper
            id="by-animal-export"
            title="Milking Records by Animal"
          >
            <div className="space-y-8">
              {animals.map((animal) => {
                // Skip animals with no milking records
                if (
                  !animal.milking_records ||
                  animal.milking_records.length === 0
                ) {
                  return null;
                }

                // Sort records by date descending
                const animalRecords = [...animal.milking_records].sort(
                  (a, b) =>
                    new Date(b.milking_date).getTime() -
                    new Date(a.milking_date).getTime()
                );

                return (
                  <div key={animal.id} className="space-y-2">
                    <h3 className="text-lg font-medium print:text-base">
                      {animal.ear_tag} - {animal.name || "Unnamed"}
                    </h3>
                    <MilkingRecordsTable
                      records={animalRecords}
                      animals={animals}
                      viewMode="table"
                    />
                  </div>
                );
              })}
            </div>
          </PrintableWrapper>
        </TabsContent>

        <TabsContent value="analytics" className="pt-4">
          <PrintableWrapper
            id="analytics-export"
            title="Quarterly Production Analytics"
            subtitle={`Q${Math.ceil(
              (selectedQuarter.getMonth() + 1) / 3
            )} ${selectedQuarter.getFullYear()}`}
          >
            <QuarterlyCharts
              milkingRecords={allMilkingRecords}
              animals={animals}
              onQuarterChange={setSelectedQuarter}
              selectedQuarter={selectedQuarter}
            />
          </PrintableWrapper>
        </TabsContent>
      </Tabs>
    </div>
  );
}
