"use server";
import { createClient } from "@/lib/supabase/server";

export async function getCalvingStats() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      totalCalvingsThisYear: 0,
      calvingsLast30Days: 0,
      liveBirthRate: 0,
      maleCalves: 0,
      femaleCalves: 0,
      avgCalvingInterval: 0,
    };
  }

  const currentYear = new Date().getFullYear();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Fetch all calving data for the user
  const { data: calvings, error } = await supabase
    .from("calvings")
    .select("calving_date, calf_sex, complications")
    .eq("user_id", user.id);

  if (error) {
    console.error("Error fetching calving stats:", error);
    return {
      totalCalvingsThisYear: 0,
      calvingsLast30Days: 0,
      liveBirthRate: 0,
      maleCalves: 0,
      femaleCalves: 0,
      avgCalvingInterval: 0,
    };
  }

  const calvingsThisYear = calvings.filter(
    (c) => new Date(c.calving_date).getFullYear() === currentYear
  );
  const liveBirths = calvings.filter(
    (c) =>
      c.complications?.toLowerCase() !== "stillbirth" &&
      c.complications?.toLowerCase() !== "aborted"
  );

  // Dummy data for interval until real logic is built
  const avgCalvingInterval = 385;

  return {
    totalCalvingsThisYear: calvingsThisYear.length,
    calvingsLast30Days: calvings.filter(
      (c) => new Date(c.calving_date) >= thirtyDaysAgo
    ).length,
    liveBirthRate:
      calvings.length > 0
        ? Math.round((liveBirths.length / calvings.length) * 100)
        : 0,
    maleCalves: calvingsThisYear.filter((c) => c.calf_sex === "Male").length,
    femaleCalves: calvingsThisYear.filter((c) => c.calf_sex === "Female")
      .length,
    avgCalvingInterval: avgCalvingInterval,
  };
}
