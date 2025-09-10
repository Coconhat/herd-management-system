"use client";

import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { MilkingRecord } from "@/lib/types";
import { Animal } from "@/lib/actions/animals";
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameDay,
  startOfQuarter,
  endOfQuarter,
  eachMonthOfInterval,
  startOfMonth,
  endOfMonth,
  isWithinInterval 
} from "date-fns";

export interface ExportData {
  records: MilkingRecord[];
  animals: Animal[];
  selectedWeek?: Date;
  selectedQuarter?: Date;
  viewMode: "excel" | "table" | "analytics" | "by-animal";
}

// Generate PDF from HTML element
export const exportToPDF = async (elementId: string, filename: string) => {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with ID "${elementId}" not found`);
  }

  try {
    // Ensure element is visible and properly styled
    const originalDisplay = element.style.display;
    const originalVisibility = element.style.visibility;
    
    element.style.display = 'block';
    element.style.visibility = 'visible';

    // Wait for any images or fonts to load
    await new Promise(resolve => setTimeout(resolve, 500));

    // Create canvas from HTML element with improved options
    const canvas = await html2canvas(element, {
      scale: 1.5, // Reduced scale for better performance
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      width: element.scrollWidth,
      height: element.scrollHeight,
      x: 0,
      y: 0,
      scrollX: 0,
      scrollY: 0,
      foreignObjectRendering: true,
      removeContainer: true,
    });

    // Restore original styles
    element.style.display = originalDisplay;
    element.style.visibility = originalVisibility;

    const imgData = canvas.toDataURL("image/png", 0.95);
    
    // Calculate PDF dimensions for better layout
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    const imgWidth = pdfWidth - 20; // 10mm margin on each side
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    let y = 10; // Start 10mm from top
    const pageHeight = pdfHeight - 20; // Account for margins

    // Add pages as needed
    let remainingHeight = imgHeight;
    let sourceY = 0;
    
    while (remainingHeight > 0) {
      const currentPageHeight = Math.min(remainingHeight, pageHeight);
      const sourceHeight = (currentPageHeight / imgHeight) * canvas.height;
      
      // Create a temporary canvas for this page section
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvas.width;
      pageCanvas.height = sourceHeight;
      const pageCtx = pageCanvas.getContext('2d');
      
      if (pageCtx) {
        pageCtx.drawImage(canvas, 0, sourceY, canvas.width, sourceHeight, 0, 0, canvas.width, sourceHeight);
        const pageImgData = pageCanvas.toDataURL("image/png", 0.95);
        
        if (sourceY > 0) {
          pdf.addPage();
        }
        
        pdf.addImage(pageImgData, "PNG", 10, y, imgWidth, currentPageHeight);
      }
      
      sourceY += sourceHeight;
      remainingHeight -= pageHeight;
    }

    pdf.save(filename);
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Print functionality
export const printElement = (elementId: string) => {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with ID "${elementId}" not found`);
  }

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    throw new Error("Could not open print window");
  }

  // Get current styles
  const styles = Array.from(document.styleSheets)
    .map(styleSheet => {
      try {
        return Array.from(styleSheet.cssRules)
          .map(rule => rule.cssText)
          .join("\n");
      } catch (e) {
        // Handle cross-origin stylesheets
        return "";
      }
    })
    .join("\n");

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Milking Records - ${format(new Date(), "MMM d, yyyy")}</title>
        <style>
          ${styles}
          @media print {
            body { margin: 0; padding: 20px; }
            .no-print { display: none !important; }
            table { page-break-inside: avoid; }
            tr { page-break-inside: avoid; page-break-after: auto; }
            .page-break { page-break-before: always; }
          }
        </style>
      </head>
      <body>
        ${element.outerHTML}
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();

  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
};

// Export to CSV
export const exportToCSV = (data: ExportData) => {
  const { records, animals, viewMode, selectedWeek } = data;
  
  let csvContent = "";
  let filename = `milking_records_${format(new Date(), "yyyy-MM-dd")}.csv`;

  if (viewMode === "excel" && selectedWeek) {
    // Excel view CSV export
    const weekDays = eachDayOfInterval({
      start: startOfWeek(selectedWeek, { weekStartsOn: 1 }),
      end: endOfWeek(selectedWeek, { weekStartsOn: 1 })
    });

    const milkingAnimals = animals.filter(animal => 
      records.some(r => r.animal_id === animal.id)
    );

    // Header row
    csvContent = "Animal,Ear Tag," + weekDays.map(day => format(day, "EEE MM/dd")).join(",") + ",Week Total\n";

    // Data rows
    milkingAnimals.forEach(animal => {
      const row = [
        `"${animal.name || 'Unnamed'}"`,
        animal.ear_tag,
        ...weekDays.map(day => {
          const dayRecords = records.filter(
            r => r.animal_id === animal.id && isSameDay(new Date(r.milking_date), day)
          );
          const total = dayRecords.reduce((sum, r) => sum + (r.milk_yield || 0), 0);
          return total > 0 ? total.toFixed(1) : "0";
        }),
        weekDays.reduce((total, day) => {
          const dayRecords = records.filter(
            r => r.animal_id === animal.id && isSameDay(new Date(r.milking_date), day)
          );
          return total + dayRecords.reduce((sum, r) => sum + (r.milk_yield || 0), 0);
        }, 0).toFixed(1)
      ];
      csvContent += row.join(",") + "\n";
    });

    filename = `weekly_milking_${format(selectedWeek, "yyyy-MM-dd")}.csv`;

  } else {
    // Standard table CSV export
    csvContent = "Date,Animal,Ear Tag,Milk Yield (L),Notes\n";
    
    records.forEach(record => {
      const animal = animals.find(a => a.id === record.animal_id);
      const row = [
        format(new Date(record.milking_date), "yyyy-MM-dd"),
        `"${animal?.name || 'Unnamed'}"`,
        animal?.ear_tag || "N/A",
        record.milk_yield?.toFixed(1) || "0",
        `"${record.notes || ''}"`
      ];
      csvContent += row.join(",") + "\n";
    });
  }

  // Download CSV
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Generate comprehensive print data (all records, not just current week)
export const generateComprehensivePrintData = (data: ExportData) => {
  const { records, animals } = data;
  
  // Group records by animal and sort by date
  const animalData = animals
    .filter(animal => records.some(r => r.animal_id === animal.id))
    .map(animal => {
      const animalRecords = records
        .filter(r => r.animal_id === animal.id)
        .sort((a, b) => new Date(b.milking_date).getTime() - new Date(a.milking_date).getTime());
      
      const totalProduction = animalRecords.reduce((sum, r) => sum + (r.milk_yield || 0), 0);
      const averageProduction = animalRecords.length > 0 ? totalProduction / animalRecords.length : 0;
      
      return {
        animal,
        records: animalRecords,
        totalProduction,
        averageProduction,
        recordCount: animalRecords.length
      };
    })
    .sort((a, b) => b.totalProduction - a.totalProduction);

  // Calculate overall statistics
  const totalAllProduction = records.reduce((sum, r) => sum + (r.milk_yield || 0), 0);
  const totalRecords = records.length;
  const activeAnimals = animalData.length;
  const averagePerRecord = totalRecords > 0 ? totalAllProduction / totalRecords : 0;
  const averagePerAnimal = activeAnimals > 0 ? totalAllProduction / activeAnimals : 0;

  return {
    animalData,
    statistics: {
      totalProduction: totalAllProduction,
      totalRecords,
      activeAnimals,
      averagePerRecord,
      averagePerAnimal,
      dateRange: {
        earliest: records.length > 0 ? 
          format(new Date(Math.min(...records.map(r => new Date(r.milking_date).getTime()))), "MMM d, yyyy") : "N/A",
        latest: records.length > 0 ? 
          format(new Date(Math.max(...records.map(r => new Date(r.milking_date).getTime()))), "MMM d, yyyy") : "N/A"
      }
    }
  };
};

// Export quarterly report to PDF
export const exportQuarterlyReport = async (data: ExportData) => {
  const { records, animals, selectedQuarter = new Date() } = data;
  
  const quarterStart = startOfQuarter(selectedQuarter);
  const quarterEnd = endOfQuarter(selectedQuarter);
  
  const quarterRecords = records.filter(record =>
    isWithinInterval(new Date(record.milking_date), {
      start: quarterStart,
      end: quarterEnd,
    })
  );

  const monthsInQuarter = eachMonthOfInterval({
    start: quarterStart,
    end: quarterEnd,
  });

  // Create PDF
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // Title
  pdf.setFontSize(20);
  pdf.text(`Quarterly Milk Production Report`, pageWidth / 2, 20, { align: "center" });
  
  pdf.setFontSize(14);
  pdf.text(`Q${Math.ceil((quarterStart.getMonth() + 1) / 3)} ${quarterStart.getFullYear()}`, pageWidth / 2, 30, { align: "center" });
  
  pdf.setFontSize(10);
  pdf.text(`Generated on ${format(new Date(), "MMM d, yyyy 'at' h:mm a")}`, pageWidth / 2, 40, { align: "center" });

  let yPosition = 60;

  // Quarter Summary
  pdf.setFontSize(16);
  pdf.text("Quarter Summary", 20, yPosition);
  yPosition += 15;

  pdf.setFontSize(12);
  const totalProduction = quarterRecords.reduce((sum, r) => sum + (r.milk_yield || 0), 0);
  const uniqueAnimals = new Set(quarterRecords.map(r => r.animal_id)).size;
  
  pdf.text(`Total Production: ${totalProduction.toFixed(1)} L`, 20, yPosition);
  yPosition += 10;
  pdf.text(`Active Animals: ${uniqueAnimals}`, 20, yPosition);
  yPosition += 10;
  pdf.text(`Total Records: ${quarterRecords.length}`, 20, yPosition);
  yPosition += 20;

  // Monthly Breakdown
  pdf.setFontSize(16);
  pdf.text("Monthly Breakdown", 20, yPosition);
  yPosition += 15;

  monthsInQuarter.forEach(month => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    
    const monthRecords = quarterRecords.filter(record =>
      isWithinInterval(new Date(record.milking_date), {
        start: monthStart,
        end: monthEnd,
      })
    );

    const monthProduction = monthRecords.reduce((sum, r) => sum + (r.milk_yield || 0), 0);
    const monthAnimals = new Set(monthRecords.map(r => r.animal_id)).size;

    pdf.setFontSize(12);
    pdf.text(`${format(month, "MMMM yyyy")}:`, 20, yPosition);
    pdf.text(`${monthProduction.toFixed(1)} L (${monthRecords.length} records, ${monthAnimals} animals)`, 80, yPosition);
    yPosition += 10;
  });

  yPosition += 10;

  // Top Performers
  const animalPerformance = animals
    .map(animal => {
      const animalRecords = quarterRecords.filter(r => r.animal_id === animal.id);
      const totalProduction = animalRecords.reduce((sum, r) => sum + (r.milk_yield || 0), 0);
      return {
        animal,
        totalProduction,
        recordCount: animalRecords.length,
      };
    })
    .filter(item => item.totalProduction > 0)
    .sort((a, b) => b.totalProduction - a.totalProduction)
    .slice(0, 10);

  pdf.setFontSize(16);
  pdf.text("Top 10 Performers", 20, yPosition);
  yPosition += 15;

  animalPerformance.forEach((item, index) => {
    if (yPosition > pageHeight - 20) {
      pdf.addPage();
      yPosition = 20;
    }
    
    pdf.setFontSize(12);
    pdf.text(`${index + 1}. ${item.animal.ear_tag} - ${item.animal.name || 'Unnamed'}`, 20, yPosition);
    pdf.text(`${item.totalProduction.toFixed(1)} L (${item.recordCount} records)`, 120, yPosition);
    yPosition += 8;
  });

  pdf.save(`quarterly_report_Q${Math.ceil((quarterStart.getMonth() + 1) / 3)}_${quarterStart.getFullYear()}.pdf`);
};

// Generate Excel-like spreadsheet data
export const generateSpreadsheetData = (data: ExportData) => {
  const { records, animals, selectedWeek = new Date() } = data;
  
  const weekDays = eachDayOfInterval({
    start: startOfWeek(selectedWeek, { weekStartsOn: 1 }),
    end: endOfWeek(selectedWeek, { weekStartsOn: 1 })
  });

  const milkingAnimals = animals.filter(animal => 
    records.some(r => r.animal_id === animal.id)
  );

  return {
    headers: ["Animal", "Ear Tag", ...weekDays.map(day => format(day, "EEE MM/dd")), "Week Total"],
    data: milkingAnimals.map(animal => {
      const weekTotal = weekDays.reduce((total, day) => {
        const dayRecords = records.filter(
          r => r.animal_id === animal.id && isSameDay(new Date(r.milking_date), day)
        );
        return total + dayRecords.reduce((sum, r) => sum + (r.milk_yield || 0), 0);
      }, 0);

      return [
        animal.name || 'Unnamed',
        animal.ear_tag,
        ...weekDays.map(day => {
          const dayRecords = records.filter(
            r => r.animal_id === animal.id && isSameDay(new Date(r.milking_date), day)
          );
          const total = dayRecords.reduce((sum, r) => sum + (r.milk_yield || 0), 0);
          return total > 0 ? total.toFixed(1) : "0";
        }),
        weekTotal.toFixed(1)
      ];
    }),
    totals: [
      "Daily Totals",
      "",
      ...weekDays.map(day => {
        const dayTotal = milkingAnimals.reduce((total, animal) => {
          const dayRecords = records.filter(
            r => r.animal_id === animal.id && isSameDay(new Date(r.milking_date), day)
          );
          return total + dayRecords.reduce((sum, r) => sum + (r.milk_yield || 0), 0);
        }, 0);
        return dayTotal.toFixed(1);
      }),
      milkingAnimals.reduce((total, animal) => {
        return total + weekDays.reduce((weekTotal, day) => {
          const dayRecords = records.filter(
            r => r.animal_id === animal.id && isSameDay(new Date(r.milking_date), day)
          );
          return weekTotal + dayRecords.reduce((sum, r) => sum + (r.milk_yield || 0), 0);
        }, 0);
      }, 0).toFixed(1)
    ]
  };
};
