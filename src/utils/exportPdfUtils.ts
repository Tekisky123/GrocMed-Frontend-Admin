import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const downloadInvoicePDF = (invoice: any, action: 'download' | 'print' = 'download') => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // --- Fonts and Colors ---
    const primaryColor: [number, number, number] = [248, 128, 14]; // Brand Orange (#F8800E)
    // For print friendliness, we use pure black/dark grays for most text
    const textDark: [number, number, number] = [0, 0, 0]; // Black for sharp printing
    const textLight: [number, number, number] = [60, 60, 60]; // Dark gray for secondary
    const textLighter: [number, number, number] = [100, 100, 100]; // Mid gray for labels

    // --- Top Accent Line ---
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, pageWidth, 4, 'F'); // Thin brand color line at the very top

    // --- Header Section ---
    let yPos = 20;

    // Company Branding
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    doc.text("GrocMed", 14, yPos);
    doc.setFontSize(14);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text("Pvt Ltd", 62, yPos, { baseline: "bottom" });

    // Document Title
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.setFontSize(24);
    doc.text("TAX INVOICE", pageWidth - 14, yPos, { align: "right" });

    yPos += 12;

    // Company Details (Left)
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(textLight[0], textLight[1], textLight[2]);
    const companyDetails = [
        "123 Business Hub, Andheri East",
        "Mumbai, Maharashtra, India 400069",
        "GSTIN: 27AABCG1234M1Z5",
        "Email: contact@grocmed.com",
        "Phone: +91 98765 43210"
    ];
    companyDetails.forEach((line) => {
        doc.text(line, 14, yPos);
        yPos += 5;
    });

    const afterCompanyY = yPos;

    // Invoice Meta (Right)
    yPos = 32;
    doc.setFontSize(10);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    
    // Helper for aligned key-value pairs
    const addMetaRow = (key: string, value: string, y: number) => {
        doc.setFont("helvetica", "bold");
        doc.text(key, pageWidth - 65, y);
        doc.setFont("helvetica", "normal");
        doc.text(value, pageWidth - 14, y, { align: "right" });
    };

    addMetaRow("Invoice No:", invoice.id || "N/A", yPos);
    addMetaRow("Date:", invoice.date || "N/A", yPos + 6);
    addMetaRow("Payment Status:", invoice.status || "N/A", yPos + 12);
    addMetaRow("Payment Method:", invoice.method || "N/A", yPos + 18);

    yPos = Math.max(afterCompanyY, yPos + 24) + 5;

    // --- Divider ---
    doc.setDrawColor(200, 200, 200);
    doc.line(14, yPos, pageWidth - 14, yPos);
    yPos += 8;

    // --- Bill To Section ---
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("BILL TO", 14, yPos);
    yPos += 6;

    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.setFontSize(12);
    doc.text(invoice.customer || "Walk-in Customer", 14, yPos);
    yPos += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(textLight[0], textLight[1], textLight[2]);
    if (invoice.gstin && invoice.gstin !== "—") {
        doc.text(`GSTIN: ${invoice.gstin}`, 14, yPos);
    } else {
        doc.text("Consumer / B2C", 14, yPos);
    }
    
    yPos += 12;

    // --- Items Table ---
    let tableData = [];
    if (invoice.products && invoice.products.length > 0) {
        tableData = invoice.products.map((item: any, index: number) => [
            (index + 1).toString(),
            item.name,
            item.quantity.toString(),
            `Rs. ${(item.price).toFixed(2)}`,
            `Rs. ${(item.price * item.quantity).toFixed(2)}`
        ]);
    } else {
        tableData = [
            ["1", `Sales - ${invoice.items} items`, "1", `Rs. ${invoice.total.toFixed(2)}`, `Rs. ${invoice.total.toFixed(2)}`]
        ];
    }

    autoTable(doc, {
        startY: yPos,
        head: [['#', 'Description', 'Qty', 'Unit Price', 'Total']],
        body: tableData,
        theme: 'grid', // 'grid' is great for B&W printing as it defines boundaries clearly without relying on color
        headStyles: {
            fillColor: [240, 240, 240], // Very light gray, perfect for B&W printers
            textColor: textDark,
            fontStyle: 'bold',
            fontSize: 10,
            lineColor: [200, 200, 200],
            lineWidth: 0.1,
            cellPadding: 5,
        },
        bodyStyles: {
            textColor: textDark,
            fontSize: 10,
            lineColor: [200, 200, 200],
            lineWidth: 0.1,
            cellPadding: 5,
        },
        columnStyles: {
            0: { cellWidth: 15, halign: 'center' },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 20, halign: 'center' },
            3: { cellWidth: 35, halign: 'right' },
            4: { cellWidth: 35, halign: 'right' },
        },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    const rightMargin = pageWidth - 14;

    // --- Totals Layout (Subtotal, Taxes, Grand Total) ---
    // We create a bounding box for totals for a clean, professional look
    const totalsBoxWidth = 85;
    const totalsBoxX = rightMargin - totalsBoxWidth;
    
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(252, 252, 252);
    // Draw box around totals
    const boxHeight = (invoice.cgst > 0 || invoice.sgst > 0 || invoice.igst > 0) ? 38 : 20;
    doc.rect(totalsBoxX, finalY, totalsBoxWidth, boxHeight, 'FD'); // Fill and Draw

    let taxY = finalY + 8;
    const paddingRight = rightMargin - 5;
    const labelX = totalsBoxX + 5;

    doc.setFontSize(10);
    doc.setTextColor(textLight[0], textLight[1], textLight[2]);
    doc.setFont("helvetica", "normal");
    doc.text("Taxable Amount:", labelX, taxY);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(`Rs. ${invoice.taxable?.toFixed(2) || "0.00"}`, paddingRight, taxY, { align: "right" });
    taxY += 7;

    if (invoice.cgst > 0 || invoice.sgst > 0) {
        doc.setTextColor(textLight[0], textLight[1], textLight[2]);
        doc.text("CGST:", labelX, taxY);
        doc.setTextColor(textDark[0], textDark[1], textDark[2]);
        doc.text(`Rs. ${invoice.cgst?.toFixed(2) || "0.00"}`, paddingRight, taxY, { align: "right" });
        taxY += 7;

        doc.setTextColor(textLight[0], textLight[1], textLight[2]);
        doc.text("SGST:", labelX, taxY);
        doc.setTextColor(textDark[0], textDark[1], textDark[2]);
        doc.text(`Rs. ${invoice.sgst?.toFixed(2) || "0.00"}`, paddingRight, taxY, { align: "right" });
        taxY += 7;
    }
    
    if (invoice.igst > 0) {
        doc.setTextColor(textLight[0], textLight[1], textLight[2]);
        doc.text("IGST:", labelX, taxY);
        doc.setTextColor(textDark[0], textDark[1], textDark[2]);
        doc.text(`Rs. ${invoice.igst?.toFixed(2) || "0.00"}`, paddingRight, taxY, { align: "right" });
        taxY += 7;
    }

    // Line above Grand Total
    const lineY = taxY - 3;
    doc.setDrawColor(200, 200, 200);
    doc.line(totalsBoxX, lineY, rightMargin, lineY);
    
    // Grand Total
    taxY += 3;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text("Grand Total:", labelX, taxY);
    
    doc.setFontSize(14);
    // Use pure black instead of primary color for the grand total so it prints clearly
    doc.text(`Rs. ${invoice.total?.toLocaleString() || "0.00"}`, paddingRight, taxY, { align: "right" });

    // --- Footer ---
    const footerY = doc.internal.pageSize.getHeight() - 15;
    
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.5);
    doc.line(14, footerY - 5, pageWidth - 14, footerY - 5);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(textLighter[0], textLighter[1], textLighter[2]);
    const footerText = "Subject to Mumbai Jurisdiction. This is a computer-generated invoice and needs no signature.";
    doc.text(footerText, pageWidth / 2, footerY + 2, { align: "center" });

    // Output
    if (action === 'print') {
        doc.autoPrint();
        const blob = doc.output('blob');
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
    } else {
        doc.save(`Invoice_${invoice.id || "Document"}.pdf`);
    }
};
