
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from './utils';

// Extend jsPDF interface if needed, but autoTable is now imported directly or via default.
// jspdf-autotable usually augments the prototype if imported.
// But some versions require direct call or passing doc.

// Explicitly calling the plugin if needed or ensuring import
// For v3.x of jspdf-autotable, it's often:
// import autoTable from 'jspdf-autotable'
// autoTable(doc, options) OR doc.autoTable(options) if side-effect works.

// Let's try importing as side-effect AND default to cover bases.

interface TicketData {
    companyName: string;
    companyAddress?: string;
    companyRuc?: string;
    customerName: string;
    customerDoc?: string;
    documentType: string;
    documentNumber: string;
    date: Date;
    items: {
        name: string;
        quantity: number;
        price: number;
        total: number;
    }[];
    subtotal: number;
    tax: number;
    total: number;
    user: string;
}

export const generateTicket = (data: TicketData) => {
    const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: [80, 200] // 80mm width, dynamic height approximation (initially 200)
    });

    let y = 10;
    const pageWidth = 80;
    const margin = 5;
    const contentWidth = pageWidth - (margin * 2);

    // Helpers
    const centerText = (text: string, yPos: number, size = 10) => {
        doc.setFontSize(size);
        const textWidth = doc.getStringUnitWidth(text) * size / doc.internal.scaleFactor;
        const x = (pageWidth - textWidth) / 2;
        doc.text(text, x, yPos);
    };

    const leftText = (text: string, yPos: number, size = 8) => {
        doc.setFontSize(size);
        doc.text(text, margin, yPos);
    };

    const feed = (amount: number) => {
        y += amount;
    };

    // --- HEADER ---
    doc.setFont("helvetica", "bold");
    centerText(data.companyName.toUpperCase(), y, 12);
    feed(5);

    doc.setFont("helvetica", "normal");
    if (data.companyRuc) {
        centerText(`RUC: ${data.companyRuc}`, y, 9);
        feed(4);
    }
    if (data.companyAddress) {
        doc.setFontSize(8);
        const splitAddress = doc.splitTextToSize(data.companyAddress, contentWidth);
        doc.text(splitAddress, margin, y, { align: 'center' });
        feed(splitAddress.length * 4);
    }
    feed(2);

    // --- DOCUMENT INFO ---
    doc.setLineWidth(0.1);
    doc.line(margin, y, pageWidth - margin, y);
    feed(4);

    doc.setFont("helvetica", "bold");
    centerText(`${data.documentType}`, y, 10);
    feed(4);
    centerText(`${data.documentNumber}`, y, 10);
    feed(6);

    // --- SALE INFO ---
    doc.setFont("helvetica", "normal");
    leftText(`Fecha: ${data.date.toLocaleString()}`, y);
    feed(4);
    leftText(`Cliente: ${data.customerName}`, y);
    feed(4);
    if (data.customerDoc) {
        leftText(`DNI/RUC: ${data.customerDoc}`, y);
        feed(4);
    }
    leftText(`Cajero: ${data.user}`, y);
    feed(4);

    doc.line(margin, y, pageWidth - margin, y);
    feed(4);

    // --- ITEMS ---
    // Using autoTable for grid
    // @ts-ignore
    autoTable(doc, {
        startY: y,
        head: [['Cant', 'Desc', 'P.Unit', 'Total']],
        body: data.items.map(item => [
            item.quantity,
            item.name,
            item.price.toFixed(2),
            item.total.toFixed(2)
        ]),
        theme: 'plain',
        styles: { fontSize: 8, cellPadding: 1, overflow: 'linebreak' },
        headStyles: { fontStyle: 'bold' },
        columnStyles: {
            0: { cellWidth: 8 },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 12, halign: 'right' },
            3: { cellWidth: 12, halign: 'right' }
        },
        margin: { top: 0, left: margin - 1, right: margin - 1 },
        tableWidth: 'auto',
    });

    // Update Y after table
    // @ts-ignore
    y = doc.lastAutoTable.finalY + 4;

    // --- TOTALS ---
    doc.line(margin, y, pageWidth - margin, y);
    feed(4);

    const rightText = (text: string, yPos: number, size = 8) => {
        doc.setFontSize(size);
        const textWidth = doc.getStringUnitWidth(text) * size / doc.internal.scaleFactor;
        doc.text(text, pageWidth - margin - textWidth, yPos);
    };

    leftText("SUBTOTAL:", y);
    rightText(formatCurrency(data.subtotal), y);
    feed(4);

    leftText("IGV (18%):", y);
    rightText(formatCurrency(data.tax), y);
    feed(4);

    doc.setFont("helvetica", "bold");
    leftText("TOTAL:", y, 10);
    rightText(formatCurrency(data.total), y, 10);
    feed(8);

    // --- FOOTER ---
    doc.setFont("helvetica", "normal");
    centerText("¡Gracias por su compra!", y, 9);

    // Output
    doc.autoPrint();
    const pdfUrl = doc.output('bloburl');
    window.open(pdfUrl, '_blank');
};
