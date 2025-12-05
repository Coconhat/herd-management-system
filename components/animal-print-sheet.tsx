"use client";

import { useEffect } from "react";
import type React from "react";
import type { Animal } from "@/lib/actions/animals";
import type { BreedingRecord } from "@/lib/types";
import type { Calving } from "@/lib/actions/calvings";
import type { HealthRecord } from "@/lib/actions/health-records";
import { Button } from "@/components/ui/button";

export interface AnimalPrintSheetProps {
  animal: Animal;
  breedingRecords: BreedingRecord[];
  calvings: Calving[];
  healthRecords: HealthRecord[];
  damLabel?: string | null;
  sireLabel?: string | null;
}

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

const capitalize = (value?: string | null) =>
  value && value.length > 0
    ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
    : "—";

export function AnimalPrintSheet({
  animal,
  breedingRecords,
  calvings,
  healthRecords,
  damLabel,
  sireLabel,
}: AnimalPrintSheetProps) {
  useEffect(() => {
    const timer = window.setTimeout(() => window.print(), 350);
    return () => window.clearTimeout(timer);
  }, []);

  const medicalTreatments = healthRecords.filter((record) => {
    const type = record.record_type?.toLowerCase() ?? "";
    return type.includes("treatment") || type.includes("medical");
  });

  const vaccinations = healthRecords.filter((record) => {
    const type = record.record_type?.toLowerCase() ?? "";
    return type.includes("vacc");
  });

  const labTests = healthRecords.filter((record) => {
    const type = record.record_type?.toLowerCase() ?? "";
    return type.includes("lab") || type.includes("test");
  });

  const trimmedBreedingRecords = [...breedingRecords].sort((a, b) =>
    a.breeding_date.localeCompare(b.breeding_date)
  );
  const trimmedCalvings = [...calvings].sort((a, b) =>
    a.calving_date.localeCompare(b.calving_date)
  );

  const infoRowClass = "border border-slate-300 px-3 py-2 text-sm";
  const headingCellClass =
    "border border-slate-400 bg-slate-100 px-2 py-1 text-xs font-semibold";

  const renderRows = <T,>(
    rows: T[],
    render: (item: T, index: number) => React.ReactNode,
    fallbackRows = 3
  ) => {
    if (rows.length > 0) {
      return rows.map((row, index) => (
        <tr key={index}>{render(row, index)}</tr>
      ));
    }

    return Array.from({ length: fallbackRows }).map((_, idx) => (
      <tr key={`empty-${idx}`}>
        <td className="border border-slate-200 px-2 py-3 text-sm" colSpan={6}>
          &nbsp;
        </td>
      </tr>
    ));
  };

  return (
    <div className="min-h-screen bg-slate-100 py-6 print:bg-white">
      <div className="mx-auto w-full max-w-[900px] bg-white p-8 shadow print:max-w-none print:shadow-none">
        <div className="print:hidden mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">DH Magpantay Dairy Farm</p>
            <p className="text-lg font-semibold">
              Animal Pedigree & Health Record
            </p>
          </div>
          <Button onClick={() => window.print()}>Print</Button>
        </div>

        <header className="mb-6 border-b border-slate-300 pb-4 text-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                DH Magpantay Dairy Farm
              </p>
              <h1 className="text-2xl font-bold text-slate-900">
                Pedigree & Individual Health Record
              </h1>
              <p className="text-xs text-slate-500">
                Generated:{" "}
                {new Date().toLocaleDateString("en-PH", {
                  dateStyle: "medium",
                })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold">Ear Tag: {animal.ear_tag}</p>
              <p className="text-sm text-slate-600">
                Name: {animal.name || "—"}
              </p>
              <p className="text-sm text-slate-600">
                Status: {animal.pregnancy_status || animal.status}
              </p>
            </div>
          </div>
        </header>

        <section className="mb-6">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-600">
            Pedigree Record
          </h2>
          <table className="w-full border border-slate-300 text-sm">
            <tbody>
              <tr>
                <td className={infoRowClass}>Identification No.</td>
                <td className={infoRowClass}>{animal.id}</td>
                <td className={infoRowClass}>Sex</td>
                <td className={infoRowClass}>{animal.sex}</td>
              </tr>
              <tr>
                <td className={infoRowClass}>Date of Birth</td>
                <td className={infoRowClass}>
                  {formatDate(animal.birth_date)}
                </td>
                <td className={infoRowClass}>Date of Sale</td>
                <td className={infoRowClass}>
                  {(animal.pregnancy_status || animal.status) === "Sold"
                    ? "Sold"
                    : "—"}
                </td>
              </tr>
              <tr>
                <td className={infoRowClass}>Dam</td>
                <td className={infoRowClass}>
                  {damLabel || animal.dam_id || "—"}
                </td>
                <td className={infoRowClass}>Sire</td>
                <td className={infoRowClass}>
                  {sireLabel || animal.sire_id || "—"}
                </td>
              </tr>
              <tr>
                <td className={infoRowClass}>Breed</td>
                <td className={infoRowClass}>{animal.breed || "—"}</td>
                <td className={infoRowClass}>Farm Source</td>
                <td className={infoRowClass}>{animal.farm_source || "—"}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="mb-6">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-600">
            Individual Breeding Record
          </h2>
          <table className="w-full border border-slate-400 text-xs">
            <thead>
              <tr>
                <th className={headingCellClass}>Date of Breeding</th>
                <th className={headingCellClass}>Coverage / Sire</th>
                <th className={headingCellClass}>Method</th>
                <th className={headingCellClass}>PD Result</th>
                <th className={headingCellClass}>Pregnancy Check Due</th>
                <th className={headingCellClass}>Expected Calving</th>
              </tr>
            </thead>
            <tbody>
              {renderRows(trimmedBreedingRecords, (record) => (
                <>
                  <td className="border border-slate-200 px-2 py-2">
                    {formatDate(record.breeding_date)}
                  </td>
                  <td className="border border-slate-200 px-2 py-2">
                    {record.sire_ear_tag || "—"}
                  </td>
                  <td className="border border-slate-200 px-2 py-2">
                    {record.breeding_method || "—"}
                  </td>
                  <td className="border border-slate-200 px-2 py-2">
                    {capitalize(record.pd_result)}
                  </td>
                  <td className="border border-slate-200 px-2 py-2">
                    {formatDate(record.pregnancy_check_due_date)}
                  </td>
                  <td className="border border-slate-200 px-2 py-2">
                    {formatDate(record.expected_calving_date)}
                  </td>
                </>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mb-6">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-600">
            Calving & Offspring Record
          </h2>
          <table className="w-full border border-slate-400 text-xs">
            <thead>
              <tr>
                <th className={headingCellClass}>Date of Calving</th>
                <th className={headingCellClass}>Calf ID / Ear Tag</th>
                <th className={headingCellClass}>Calf Sex</th>
                <th className={headingCellClass}>Birth Weight</th>
                <th className={headingCellClass}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {renderRows(trimmedCalvings, (calving) => (
                <>
                  <td className="border border-slate-200 px-2 py-2">
                    {formatDate(calving.calving_date)}
                  </td>
                  <td className="border border-slate-200 px-2 py-2">
                    {calving.calf_ear_tag || "—"}
                  </td>
                  <td className="border border-slate-200 px-2 py-2">
                    {calving.calf_sex || "—"}
                  </td>
                  <td className="border border-slate-200 px-2 py-2">
                    {calving.birth_weight ? `${calving.birth_weight} kg` : "—"}
                  </td>
                  <td className="border border-slate-200 px-2 py-2">
                    {calving.complications || calving.notes || "—"}
                  </td>
                </>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mb-6">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-600">
            Medical Treatments
          </h2>
          <table className="w-full border border-slate-400 text-xs">
            <thead>
              <tr>
                <th className={headingCellClass}>Date</th>
                <th className={headingCellClass}>Treatment</th>
                <th className={headingCellClass}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {renderRows(medicalTreatments, (record) => (
                <>
                  <td className="border border-slate-200 px-2 py-2">
                    {formatDate(record.record_date)}
                  </td>
                  <td className="border border-slate-200 px-2 py-2">
                    {record.treatment || record.record_type || "—"}
                  </td>
                  <td className="border border-slate-200 px-2 py-2">
                    {record.notes || record.description || "—"}
                  </td>
                </>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mb-6 grid gap-6 md:grid-cols-2">
          <div>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-600">
              Vaccinations
            </h2>
            <table className="w-full border border-slate-400 text-xs">
              <thead>
                <tr>
                  <th className={headingCellClass}>Date</th>
                  <th className={headingCellClass}>Vaccine</th>
                </tr>
              </thead>
              <tbody>
                {renderRows(
                  vaccinations,
                  (record) => (
                    <>
                      <td className="border border-slate-200 px-2 py-2">
                        {formatDate(record.record_date)}
                      </td>
                      <td className="border border-slate-200 px-2 py-2">
                        {record.treatment || record.record_type || "—"}
                      </td>
                    </>
                  ),
                  4
                )}
              </tbody>
            </table>
          </div>
          <div>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-600">
              Laboratory Tests
            </h2>
            <table className="w-full border border-slate-400 text-xs">
              <thead>
                <tr>
                  <th className={headingCellClass}>Date</th>
                  <th className={headingCellClass}>Type of Test</th>
                  <th className={headingCellClass}>Result</th>
                </tr>
              </thead>
              <tbody>
                {renderRows(
                  labTests,
                  (record) => (
                    <>
                      <td className="border border-slate-200 px-2 py-2">
                        {formatDate(record.record_date)}
                      </td>
                      <td className="border border-slate-200 px-2 py-2">
                        {record.record_type}
                      </td>
                      <td className="border border-slate-200 px-2 py-2">
                        {record.notes || record.description || "—"}
                      </td>
                    </>
                  ),
                  4
                )}
              </tbody>
            </table>
          </div>
        </section>

        <footer className="mt-10 text-xs text-slate-500">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="border-t border-slate-300 pt-2 text-center">
              <p className="font-semibold">---</p>
              <p>Farm Assistant</p>
            </div>
            <div className="border-t border-slate-300 pt-2 text-center">
              <p className="font-semibold">---</p>
              <p>Farm Manager</p>
            </div>
            <div className="border-t border-slate-300 pt-2 text-center">
              <p className="font-semibold">---</p>
              <p>Farm Supervisor</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
