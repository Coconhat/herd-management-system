import { Animal } from "./actions/animals";

export function getClassification(animal: Animal): {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
} {
  if (animal.birth_date) {
    const birth = new Date(animal.birth_date);
    const today = new Date();
    const diffTime = today.getTime() - birth.getTime();
    const ageInDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Handle future birth dates (negative age)
    if (ageInDays < 0) {
      return { label: "Not Born Yet", variant: "outline" };
    }

    // Handle newborn animals (0-30 days)
    if (ageInDays >= 0 && ageInDays <= 30) {
      return { label: "Newborn", variant: "default" };
    }

    // Handle other age categories
    if (ageInDays >= 31 && ageInDays <= 90)
      return { label: "Newly Calved", variant: "default" };
    if (ageInDays >= 91 && ageInDays <= 180)
      return { label: "Weaning", variant: "secondary" };
    if (ageInDays >= 181 && ageInDays <= 360)
      return { label: "Yearling", variant: "outline" };
    if (ageInDays >= 361 && ageInDays <= 450)
      return { label: "Heifer", variant: "default" };
    if (ageInDays >= 451 && ageInDays <= 540)
      return { label: "Breedable Heifer", variant: "destructive" };

    return { label: "Fully Grown", variant: "secondary" };
  }
  return { label: "Unknown", variant: "outline" };
}
