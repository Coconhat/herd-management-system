"use client";

import { MilkingRecord } from "@/lib/types";
import { Animal } from "@/lib/actions/animals";
import { format } from "date-fns";
import { generateComprehensivePrintData } from "./export-utils";

interface ComprehensivePrintViewProps {
  records: MilkingRecord[];
  animals: Animal[];
  id: string;
}

export function ComprehensivePrintView({ records, animals, id }: ComprehensivePrintViewProps) {
  const data = generateComprehensivePrintData({ records, animals, viewMode: "table" });

  return (
    <div id={id} className="hidden print:block print:p-4">
      {/* Print Header */}
      <div className="text-center border-b pb-4 mb-6">
        <h1 className="text-3xl font-bold mb-2">Comprehensive Milk Production Report</h1>
        <p className="text-lg text-gray-600 mb-2">Complete Production History</p>
        <div className="text-sm text-gray-500">
          <p>Generated on {format(new Date(), "MMMM d, yyyy 'at' h:mm a")}</p>
          <p>Data Period: {data.statistics.dateRange.earliest} - {data.statistics.dateRange.latest}</p>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Production Summary</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-50 p-4 rounded border">
            <div className="text-2xl font-bold text-blue-600">{data.statistics.totalProduction.toFixed(1)} L</div>
            <div className="text-sm text-gray-600">Total Production</div>
          </div>
          <div className="bg-gray-50 p-4 rounded border">
            <div className="text-2xl font-bold text-green-600">{data.statistics.activeAnimals}</div>
            <div className="text-sm text-gray-600">Active Animals</div>
          </div>
          <div className="bg-gray-50 p-4 rounded border">
            <div className="text-2xl font-bold text-purple-600">{data.statistics.totalRecords}</div>
            <div className="text-sm text-gray-600">Total Records</div>
          </div>
          <div className="bg-gray-50 p-4 rounded border">
            <div className="text-2xl font-bold text-orange-600">{data.statistics.averagePerRecord.toFixed(1)} L</div>
            <div className="text-sm text-gray-600">Average per Record</div>
          </div>
        </div>
      </div>

      {/* Animal Performance Ranking */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Animal Performance Ranking</h2>
        <table className="w-full border-collapse mb-6">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-3 py-2 text-left">Rank</th>
              <th className="border border-gray-300 px-3 py-2 text-left">Ear Tag</th>
              <th className="border border-gray-300 px-3 py-2 text-left">Name</th>
              <th className="border border-gray-300 px-3 py-2 text-right">Total Production (L)</th>
              <th className="border border-gray-300 px-3 py-2 text-right">Records</th>
              <th className="border border-gray-300 px-3 py-2 text-right">Average (L)</th>
            </tr>
          </thead>
          <tbody>
            {data.animalData.map((item, index) => (
              <tr key={item.animal.id} className={index % 2 === 0 ? "bg-gray-50" : ""}>
                <td className="border border-gray-300 px-3 py-2 font-medium">#{index + 1}</td>
                <td className="border border-gray-300 px-3 py-2 font-medium">{item.animal.ear_tag}</td>
                <td className="border border-gray-300 px-3 py-2">{item.animal.name || "Unnamed"}</td>
                <td className="border border-gray-300 px-3 py-2 text-right font-mono">{item.totalProduction.toFixed(1)}</td>
                <td className="border border-gray-300 px-3 py-2 text-right">{item.recordCount}</td>
                <td className="border border-gray-300 px-3 py-2 text-right font-mono">{item.averageProduction.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detailed Records by Animal */}
      {data.animalData.map((animalData, animalIndex) => (
        <div key={animalData.animal.id} className={`mb-8 ${animalIndex > 0 ? 'page-break' : ''}`}>
          <h3 className="text-lg font-bold mb-3 flex items-center justify-between">
            <span>{animalData.animal.ear_tag} - {animalData.animal.name || "Unnamed"}</span>
            <span className="text-sm font-normal text-gray-600">
              Total: {animalData.totalProduction.toFixed(1)}L | Avg: {animalData.averageProduction.toFixed(1)}L
            </span>
          </h3>
          
          <table className="w-full border-collapse mb-4">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-3 py-2 text-left">Date</th>
                <th className="border border-gray-300 px-3 py-2 text-right">Milk Yield (L)</th>
                <th className="border border-gray-300 px-3 py-2 text-left">Notes</th>
              </tr>
            </thead>
            <tbody>
              {animalData.records.map((record, recordIndex) => (
                <tr key={record.id} className={recordIndex % 2 === 0 ? "bg-gray-50" : ""}>
                  <td className="border border-gray-300 px-3 py-2">
                    {format(new Date(record.milking_date), "MMM d, yyyy")}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-right font-mono">
                    {record.milk_yield?.toFixed(1) || "0.0"}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-sm">
                    {record.notes || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {/* Footer */}
      <div className="print:mt-8 print:pt-4 print:border-t border-gray-300 text-center text-xs text-gray-500">
        <p className="mb-1">Calving Management System - Comprehensive Milk Production Report</p>
        <p>Generated automatically on {format(new Date(), "MMMM d, yyyy 'at' h:mm a")} | Please verify data accuracy</p>
        <p className="mt-2 font-medium">
          Report includes {data.statistics.totalRecords} records from {data.statistics.activeAnimals} animals
        </p>
      </div>
    </div>
  );
}
