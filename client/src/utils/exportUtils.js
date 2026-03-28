import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export const exportToPDF = (data, columns, title = 'Report', orientation = 'portrait') => {
    const doc = new jsPDF(orientation);

    // Header
    doc.setFillColor(16, 185, 129); // Emerald Green
    doc.rect(0, 0, 297, 20, 'F'); // Width for A4 landscape max, safe for portrait too due to crop
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text(`Global Access LIMS - ${title}`, 14, 13);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

    // Map data to rows based on columns
    // Columns expected format: { header: 'Name', accessor: 'key' }
    const tableBody = data.map(row =>
        columns.map(col => {
            const val = row[col.accessor];
            return val !== null && val !== undefined ? String(val) : '';
        })
    );

    const tableHeaders = [columns.map(c => c.header)];

    doc.autoTable({
        head: tableHeaders,
        body: tableBody,
        startY: 32,
        theme: 'grid',
        headStyles: {
            fillColor: [47, 79, 79], // Slate Grey
            textColor: 255,
            fontSize: 9,
            fontStyle: 'bold'
        },
        styles: {
            fontSize: 8,
            cellPadding: 2,
            overflow: 'linebreak'
        },
        alternateRowStyles: {
            fillColor: [245, 245, 245]
        }
    });

    doc.save(`${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const exportToExcel = (data, fileName = 'Export') => {
    const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    const fileExtension = '.xlsx';

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = { Sheets: { 'data': ws }, SheetNames: ['data'] };
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

    const dataBlob = new Blob([excelBuffer], { type: fileType });
    saveAs(dataBlob, fileName + fileExtension);
};
