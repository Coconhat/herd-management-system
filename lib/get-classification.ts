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

    if (ageInDays >= 1 && ageInDays <= 90)
      return { label: "Newly Calved", variant: "default" }; // green/primary
    if (ageInDays >= 91 && ageInDays <= 180)
      return { label: "Weaning", variant: "secondary" }; // gray
    if (ageInDays >= 181 && ageInDays <= 360)
      return { label: "Yearling", variant: "outline" }; // neutral border
    if (ageInDays >= 361 && ageInDays <= 450)
      return { label: "Heifer", variant: "default" }; // green
    if (ageInDays >= 451 && ageInDays <= 540)
      return { label: "Breedable Heifer", variant: "destructive" }; // red

    return { label: "Fully Grown", variant: "secondary" }; // gray
  }
  return { label: "Unknown", variant: "outline" };
}
