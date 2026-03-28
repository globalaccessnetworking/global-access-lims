import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Generates a branded PDF report.
 * @param {string} title - Title of the report (e.g., "Biological Asset Report")
 * @param {Array} columns - Array of column objects/strings for the table
 * @param {Array} data - Array of data rows
 * @param {string} filename - Output filename
 */
export const generatePDF = (title, columns, data, filename = 'report.pdf') => {
    const doc = new jsPDF();

    // -- Branding Header --
    // Logo Placeholder (Using text for now, could add image later)
    doc.setFontSize(22);
    doc.setTextColor(16, 185, 129); // Emerald Green
    doc.text("Global Access Laboratory", 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("University of the Punjab", 14, 26);

    // -- Report Meta --
    const date = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString();
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text(`Generated on: ${date}`, 14, 35);
    doc.text(`Total Records: ${data.length}`, 14, 40);

    // -- Title --
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42); // Midnight Blue
    doc.text(title, 14, 50);

    // -- AutoTable --
    doc.autoTable({
        startY: 55,
        head: [columns],
        body: data,
        theme: 'grid',
        headStyles: {
            fillColor: [16, 185, 129], // Emerald
            textColor: 255,
            fontSize: 10,
            fontStyle: 'bold'
        },
        styles: {
            fontSize: 9,
            textColor: [51, 65, 85] // Slate 700
        },
        alternateRowStyles: {
            fillColor: [248, 250, 252] // Slate 50
        },
        margin: { top: 55 }
    });

    // -- Footer --
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text('Confidential - Internal Use Only', 14, doc.internal.pageSize.height - 10);
        doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 25, doc.internal.pageSize.height - 10);
    }

    // Save
    doc.save(filename);
};
