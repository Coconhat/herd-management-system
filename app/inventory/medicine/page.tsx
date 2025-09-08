import { getMedicines } from "@/lib/actions/medicines";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { differenceInDays, isBefore, parseISO, startOfToday } from "date-fns";
import { AddMedicineModal } from "./_components/add-medicine-modal";

// Define a type for the variant of the badge component, assuming 'warning' is available.
type BadgeVariant = "default" | "secondary" | "destructive" | "warning";

export default async function MedicineInventoryPage() {
  const medicines = await getMedicines();
  const today = startOfToday();

  const getStatus = (
    expDate: string | null | undefined
  ): { text: string; variant: BadgeVariant } => {
    if (!expDate) return { text: "No Expiry", variant: "secondary" };

    const expirationDate = parseISO(expDate);
    if (isBefore(expirationDate, today)) {
      return { text: "Expired", variant: "destructive" };
    }

    const daysUntilExpiry = differenceInDays(expirationDate, today);
    if (daysUntilExpiry <= 30) {
      return {
        text: `Expires in ${daysUntilExpiry}d`,
        variant: "warning" as BadgeVariant,
      };
    }

    return { text: "Good", variant: "default" };
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <h1 className="text-3xl font-bold">Medicine Inventory</h1>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>All Medicines</CardTitle>
            <CardDescription>
              View, add, and manage your medicine stock and expiration dates.
            </CardDescription>
          </div>
          <AddMedicineModal />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Stock Quantity</TableHead>
                <TableHead>Expiration Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {medicines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No medicines found. Add one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                medicines.map((med) => {
                  const status = getStatus(med.expiration_date);
                  return (
                    <TableRow key={med.id}>
                      <TableCell className="font-medium">{med.name}</TableCell>
                      <TableCell>
                        {med.stock_quantity} {med.unit}
                      </TableCell>
                      <TableCell>
                        {med.expiration_date
                          ? new Date(med.expiration_date).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.text}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
