import { cn } from "@/lib/utils";

const renderFarmSource = (source?: string | null) => {
  const normalizedSource = source?.trim();

  if (!normalizedSource) {
    return <span className="text-muted-foreground">—</span>;
  }

  const baseClasses =
    "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium";
  const paletteMap: Record<string, string> = {
    DH: "bg-emerald-300 text-emerald-700 border-emerald-100",
    "Sam's": "bg-white/400 text-amber-700 border-amber-100",
  };

  return (
    <span
      className={cn(
        baseClasses,
        paletteMap[normalizedSource] ??
          "bg-muted text-muted-foreground border-muted"
      )}
    >
      {normalizedSource}
    </span>
  );
};
export default renderFarmSource;
