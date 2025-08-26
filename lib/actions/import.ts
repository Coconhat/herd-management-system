"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Type definitions (use ear_tag strings for initial insert; update numeric parent ids later)
type SheetData = { sheetName: string; data: any[][] };
type AnimalToCreate = {
  ear_tag: string;
  birth_date: string | null;
  sex: "FEMALE" | "MALE" | null;
  dam_id: string | null;
  sire_id: string | null;
  breed: string | null;
  weight: number | null;
};
type CalvingToCreate = {
  dam_id: string;
  calf_ear_tag: string;
  calving_date: string;
  calf_sex: "Male" | "Female";
  birth_weight: number | null;
};

function cleanValue(value: any): string | null {
  if (value === null || value === undefined) return null;
  let str = String(value).trim();

  // normalize unicode dashes and non-breaking spaces
  str = str.replace(/[\u2010-\u2015\u2212]/g, "-").replace(/\u00A0/g, " ");

  // remove leading punctuation / control chars (unicode-aware)
  str = str
    .replace(/^[^\p{L}\p{N}]+/u, "")
    .replace(/_+/g, " ")
    .trim();

  if (!str) return null;
  if (/^(?:_{2,}|-+|—+|–+)$/.test(str)) return null;
  return str;
}

// take a raw cell string and try to pick the real ear-tag token
function normalizeEarTag(raw: string | null) {
  if (!raw) return null;
  const s = raw.trim();
  // common pattern: "117 EVA" or "50-JOYCE" => prefer leading numeric/alpha token
  const parts = s.split(/\s+|\/|-|,|\|/).filter(Boolean);
  for (const p of parts) {
    const pClean = p.replace(/[^A-Za-z0-9]/g, "");
    if (/^[0-9]{1,6}$/.test(pClean) || /^[A-Za-z0-9]{1,8}$/.test(pClean)) {
      return pClean;
    }
  }
  // fallback: short alphanumeric whole cell
  if (/^[A-Za-z0-9 ]{1,20}$/.test(s)) return s.replace(/\s+/g, " ").trim();
  return null;
}

function findSexInSheet(data: any[][]): "Female" | "Male" | null {
  const maxRows = Math.min(20, data.length);
  const maxCols = 12;

  // 1) exact tokens anywhere near top-left
  for (let r = 0; r < maxRows; r++) {
    for (let c = 0; c < Math.min(maxCols, (data[r] || []).length); c++) {
      const raw = cleanValue(data?.[r]?.[c]);
      if (!raw) continue;
      const lower = raw.toLowerCase();
      if (/^(female|f|♀)$/i.test(lower)) return "Female";
      if (/^(male|m|♂)$/i.test(lower)) return "Male";
    }
  }

  // 2) label neighbors: find a 'sex' or 'gender' label and read adjacent cells
  const labelRegex = /^\s*(sex|gender|sexe|sexo)\s*$/i;
  for (let r = 0; r < maxRows; r++) {
    for (let c = 0; c < Math.min(maxCols, (data[r] || []).length); c++) {
      const raw = cleanValue(data?.[r]?.[c]);
      if (!raw) continue;
      if (labelRegex.test(raw)) {
        const candidates = [
          cleanValue(data?.[r]?.[c + 1]),
          cleanValue(data?.[r + 1]?.[c]),
          cleanValue(data?.[r]?.[c - 1]),
          cleanValue(data?.[r - 1]?.[c]),
        ];
        for (const cand of candidates) {
          if (!cand) continue;
          if (/^f/i.test(cand)) return "Female";
          if (/^m/i.test(cand)) return "Male";
          if (/female/i.test(cand)) return "Female";
          if (/male/i.test(cand)) return "Male";
        }
      }
    }
  }

  // 3) fallback: search a slightly wider area for 'female'/'male' substrings
  for (let r = 0; r < maxRows; r++) {
    for (let c = 0; c < Math.min(40, (data[r] || []).length); c++) {
      const raw = cleanValue(data?.[r]?.[c]);
      if (!raw) continue;
      if (/female/i.test(raw)) return "Female";
      if (/male/i.test(raw)) return "Male";
    }
  }

  return null;
}

// safe getter
function getCell(data: any[][], r: number, c: number) {
  return data?.[r]?.[c] ?? null;
}

// robust finder tuned to your sample layout
function findEarTagInSheet(data: any[][]) {
  // 1) very likely in Row 3 col 3 (IDENTIFICATION NO. middle cell) -> data[2][2]
  let raw = cleanValue(getCell(data, 2, 2));
  let tag = normalizeEarTag(raw);
  if (tag) return tag;

  // 2) check a few other likely positions (C8, old B4, ID labels)
  const tries: Array<[number, number]> = [
    [7, 2], // C8 (your new target)
    [3, 1], // B4 (your original)
    [2, 1], // maybe the ID sits in col B of row 3
    [2, 3], // alternate right column
    [4, 1], // date row neighbors
    [5, 1], // dam id cell (some sheets put "117 EVA" here)
  ];
  for (const [r, c] of tries) {
    raw = cleanValue(getCell(data, r, c));
    tag = normalizeEarTag(raw);
    if (tag) return tag;
  }

  // 3) row-scan: search first 6 rows for an IDENTIFICATION-like token (fast)
  for (let r = 0; r <= Math.min(6, data.length - 1); r++) {
    const row = data[r] || [];
    for (let c = 0; c < Math.min(8, row.length); c++) {
      raw = cleanValue(getCell(data, r, c));
      tag = normalizeEarTag(raw);
      if (tag) {
        if (!/identification|date|sex|pedigree|record/i.test(String(raw)))
          return tag;
      }
    }
  }

  // 4) full neighborhood fallback (first 15 rows x 6 cols)
  for (let r = 0; r < Math.min(15, data.length); r++) {
    for (let c = 0; c < Math.min(6, (data[r] || []).length); c++) {
      raw = cleanValue(getCell(data, r, c));
      tag = normalizeEarTag(raw);
      if (tag) return tag;
    }
  }

  return null;
}

// canonicalize for map keys (always trim & uppercase numeric-like tokens)
function canonicalizeTag(raw: string | null) {
  const n = normalizeEarTag(raw);
  if (!n) return null;
  // if numeric-only, remove leading zeros? (optional) — keep as-is to preserve IDs like "0759"
  return n.toString().trim();
}

// Parse date from the form format (handles many orders and returns YYYY-MM-DD or null)
function parseFormDate(dateStr: any): string | null {
  if (!dateStr) return null;
  const s = dateStr.toString().trim();
  if (!s) return null;

  // Normalize separators to '-' then split
  const parts = s
    .replace(/\./g, "-")
    .replace(/\//g, "-")
    .split("-")
    .map((p: any) => p.trim())
    .filter(Boolean);
  if (parts.length !== 3) return null;

  // If any part is 4-digit, that's the year
  let yearIndex = parts.findIndex((p: any) => p.length === 4);
  if (yearIndex === -1) {
    // if any part > 31 (impossible day) it's likely the year
    yearIndex = parts.findIndex((p: any) => {
      const n = parseInt(p, 10);
      return !isNaN(n) && n > 31;
    });
  }
  if (yearIndex === -1) {
    // default to last part as year (common MM-DD-YY)
    yearIndex = 2;
  }

  let year = parts[yearIndex];
  if (year.length === 2) year = `20${year}`;
  year = year.padStart(4, "0");

  // remaining two parts are month/day but order may vary — choose by heuristic
  const others = parts.filter((_: any, i: any) => i !== yearIndex);
  if (others.length !== 2) return null;
  let [a, b] = others;
  const ai = parseInt(a, 10),
    bi = parseInt(b, 10);
  if (isNaN(ai) || isNaN(bi)) return null;

  // prefer (month <=12). If a > 12 and b <=12, swap.
  let month = a,
    day = b;
  if (ai > 12 && bi <= 12) {
    month = b;
    day = a;
  } else {
    // otherwise assume a is month, b is day (covers common MM-DD-YY & MM/DD/YYYY)
    month = a;
    day = b;
  }

  const mi = parseInt(month, 10);
  const di = parseInt(day, 10);
  if (mi < 1 || mi > 12 || di < 1 || di > 31) return null;

  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

// Extract numeric value from weaning weight (e.g., "238W" -> 238)
function parseWeaningWeight(weightStr: string | null): number | null {
  if (!weightStr) return null;
  const numericStr = weightStr.replace(/[^0-9.]/g, "");
  const value = parseFloat(numericStr);
  return isNaN(value) ? null : value;
}

// Main import function
export async function structuredImportAction(sheetsData: SheetData[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated.");

  const results = { success: 0, skipped: 0, errors: [] as string[] };

  // Get existing animals for this user and canonicalize keys
  const { data: existingAnimals, error: fetchError } = await supabase
    .from("animals")
    .select("id, ear_tag")
    .eq("user_id", user.id);

  if (fetchError) {
    results.errors.push(
      `Error fetching existing animals: ${fetchError.message}`
    );
    return results;
  }

  // Map canonical ear_tag -> numeric id
  const earTagToIdMap = new Map<string, number>(
    (existingAnimals || []).map((a: any) => {
      const key = canonicalizeTag(a.ear_tag) || String(a.ear_tag).trim();
      return [key, a.id];
    })
  );

  const allAnimalsToCreate: AnimalToCreate[] = [];
  const allCalvingsToCreate: CalvingToCreate[] = [];
  const processedTags = new Set<string>(
    (existingAnimals || []).map(
      (a: any) => canonicalizeTag(a.ear_tag) || String(a.ear_tag).trim()
    )
  );

  // Process each sheet
  for (const sheet of sheetsData) {
    try {
      const data = sheet.data;

      // Extract the main animal (current record)
      const rawTag = findEarTagInSheet(data);
      const animalEarTag = canonicalizeTag(rawTag);
      if (!animalEarTag) {
        results.errors.push(`No ear tag found in sheet: ${sheet.sheetName}`);
        continue;
      }

      console.log("DEBUG sex raw:", JSON.stringify(getCell(data, 4, 6)));
      console.log(
        "DEBUG chars:",
        Array.from(String(getCell(data, 4, 6) ?? "")).map((ch) =>
          ch.charCodeAt(0)
        )
      );

      // If animal already exists, skip
      if (processedTags.has(animalEarTag)) {
        results.skipped++;
        continue;
      }

      // Extract animal data from pedigree section (normalize dam/sire)
      const birthDate = parseFormDate(cleanValue(data[4]?.[2])); // Row 5, Column B
      const sex = findSexInSheet(data);

      const damRaw = cleanValue(data[5]?.[1]); // Row 6, Column B
      const sireRaw = cleanValue(data[5]?.[3]); // Row 6, Column D
      const damEarTag = canonicalizeTag(damRaw);
      const sireEarTag = canonicalizeTag(sireRaw);
      const weaningWeightStr = cleanValue(data[6]?.[1]); // Row 7, Column B
      const weaningWeight = parseWeaningWeight(weaningWeightStr);

      // Add main animal to create list (store ear_tag text; parent numeric ids will be linked later)
      allAnimalsToCreate.push({
        ear_tag: animalEarTag,
        birth_date: birthDate,
        sex,
        dam_id: damEarTag,
        sire_id: sireEarTag,
        breed: null,
        weight: weaningWeight,
      });
      processedTags.add(animalEarTag);
      console.log("processsed tag to add");
      console.log(processedTags.add(animalEarTag));

      // Process breeding records (rows 21-26 in the form)
      for (let rowIdx = 20; rowIdx <= 25; rowIdx++) {
        const calvingDateRaw = cleanValue(data[rowIdx]?.[4]); // Column E (Date of Calving)
        const calvingDate = parseFormDate(calvingDateRaw);
        const calfRaw = cleanValue(data[rowIdx]?.[5]); // Column F (Calf ID)
        const calfTag = canonicalizeTag(calfRaw);
        const sireInfoRaw = cleanValue(data[rowIdx]?.[2]); // Column C (Sire ID & Breed)
        const sireInfo = canonicalizeTag(sireInfoRaw);

        // Only process rows with actual data
        if (calfTag && calvingDate) {
          allCalvingsToCreate.push({
            dam_id: animalEarTag,
            calf_ear_tag: calfTag,
            calving_date: calvingDate,
            calf_sex: calfTag.startsWith("M") ? "Male" : "Female",
            birth_weight: null,
          });

          console.log(allCalvingsToCreate);

          // Also create the calf animal if it doesn't exist
          if (!processedTags.has(calfTag)) {
            allAnimalsToCreate.push({
              ear_tag: calfTag,
              birth_date: calvingDate,
              sex: calfTag.startsWith("M") ? "Male" : "Female",
              dam_id: animalEarTag,
              sire_id: sireInfo,
              breed: null,
              weight: null,
            });
            processedTags.add(calfTag);
            console.log(processedTags.add(calfTag));
          } else {
            results.skipped++;
          }
        }
      }
    } catch (error) {
      results.errors.push(
        `Error processing sheet ${sheet.sheetName}: ${(error as Error).message}`
      );
    }
  }

  // Insert all animals (text fields like dam_id / sire_id will be updated to numeric ids later)
  if (allAnimalsToCreate.length > 0) {
    try {
      const { data: newAnimals, error: insertError } = await supabase
        .from("animals")
        .insert(
          allAnimalsToCreate.map((animal) => ({
            user_id: user.id,
            ear_tag: animal.ear_tag,
            birth_date: animal.birth_date,
            sex: animal.sex,
            dam_id: animal.dam_id,
            sire_id: animal.sire_id,
            breed: animal.breed,
            weight: animal.weight,
            status: "Active",
          }))
        )
        .select("id, ear_tag");

      if (insertError) {
        results.errors.push(`Error inserting animals: ${insertError.message}`);
      } else if (newAnimals) {
        // Update the earTagToIdMap with newly inserted animals (canonical keys)
        newAnimals.forEach((animal: any) => {
          const key =
            canonicalizeTag(animal.ear_tag) || String(animal.ear_tag).trim();
          earTagToIdMap.set(key, animal.id);
        });

        // Update parent relationships (dam_id / sire_id numeric FK) for animals that have parents
        const updatePromises = allAnimalsToCreate.map(async (animal) => {
          if (animal.dam_id || animal.sire_id) {
            const damId = animal.dam_id
              ? earTagToIdMap.get(animal.dam_id)
              : null;
            const sireId = animal.sire_id
              ? earTagToIdMap.get(animal.sire_id)
              : null;

            if (damId || sireId) {
              const { error } = await supabase
                .from("animals")
                .update({
                  dam_id: damId,
                  sire_id: sireId,
                })
                .eq("ear_tag", animal.ear_tag);

              if (error) {
                results.errors.push(
                  `Error updating parents for ${animal.ear_tag}: ${error.message}`
                );
              }
            }
          }
        });

        await Promise.all(updatePromises);
      }
    } catch (error: any) {
      results.errors.push(
        `Error in animal insertion: ${error.message ?? String(error)}`
      );
    }
  }

  // Insert calving records
  if (allCalvingsToCreate.length > 0) {
    try {
      const calvingRecords = allCalvingsToCreate
        .map((calving) => {
          const damId = earTagToIdMap.get(calving.dam_id);
          if (!damId) {
            results.errors.push(
              `No dam ID found for ear tag: ${calving.dam_id}`
            );
            return null;
          }

          return {
            user_id: user.id,
            animal_id: damId,
            calving_date: calving.calving_date,
            calf_ear_tag: calving.calf_ear_tag,
            calf_sex: calving.calf_sex,
            birth_weight: calving.birth_weight,
          };
        })
        .filter((record) => record !== null);

      if (calvingRecords.length > 0) {
        const { error: calvingError } = await supabase
          .from("calvings")
          .insert(calvingRecords);
        if (calvingError) {
          results.errors.push(
            `Error inserting calvings: ${calvingError.message}`
          );
        } else {
          results.success += calvingRecords.length;
        }
      }
    } catch (error: any) {
      results.errors.push(
        `Error in calving insertion: ${(error as Error).message}`
      );
    }
  }

  revalidatePath("/dashboard", "layout");
  return results;
}
