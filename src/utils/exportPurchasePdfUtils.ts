import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const downloadPurchaseInvoicePDF = (purchase: any) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // --- Fonts and Colors ---
    const primaryColor: [number, number, number] = [0, 153, 51]; // Brand Green (#009933) - Good for Inward/Stock
    const textDark: [number, number, number] = [0, 0, 0];
    const textLight: [number, number, number] = [60, 60, 60];
    const textLighter: [number, number, number] = [100, 100, 100];

    // --- Top Accent Line ---
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, pageWidth, 4, 'F');

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
    doc.setFontSize(22);
    doc.text("PURCHASE INVOICE", pageWidth - 14, yPos, { align: "right" });

    yPos += 12;

    // Buyer Details (GrocMed - Inward)
    doc.setFontSize(10);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont("helvetica", "bold");
    doc.text("SHIP TO / BUYER", 14, yPos);
    
    yPos += 6;
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.setFontSize(11);
    doc.text("GrocMed Private Limited", 14, yPos);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(textLight[0], textLight[1], textLight[2]);
    const grocmedDetails = [
        "ZHPL - SS Hyderabad Moosarambagh ES117",
        "16-2-705/1/1, Old Malakpet, Hyderabad 500036",
        "GSTIN: 36AAACZ8867B1Z1",
        "FSSAI: 10020064002537 | PAN: AAACZ8867B",
        "Place of Supply: Telangana"
    ];
    grocmedDetails.forEach((line) => {
        yPos += 5;
        doc.text(line, 14, yPos);
    });

    const buyerEndY = yPos;

    // Purchase Meta (Right)
    yPos = 32;
    const addMetaRow = (key: string, value: string, y: number) => {
        doc.setFont("helvetica", "bold");
        doc.text(key, pageWidth - 70, y);
        doc.setFont("helvetica", "normal");
        doc.text(value, pageWidth - 14, y, { align: "right" });
    };

    addMetaRow("Invoice No:", purchase.invoiceNo || "N/A", yPos);
    addMetaRow("Date:", new Date(purchase.date).toLocaleDateString() || "N/A", yPos + 6);
    addMetaRow("Payment Status:", purchase.status || "Unpaid", yPos + 12);
    addMetaRow("Entry Type:", "Stock Inward", yPos + 18);

    yPos = Math.max(buyerEndY, yPos + 24) + 10;

    // --- Supplier Section ---
    doc.setDrawColor(230, 230, 230);
    doc.setFillColor(250, 250, 250);
    doc.rect(14, yPos, pageWidth - 28, 25, 'FD');

    const supplierY = yPos + 8;
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("SUPPLIER / VENDOR", 18, supplierY);
    
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.setFontSize(12);
    doc.text(purchase.supplierName || "System Vendor", 18, supplierY + 8);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(textLight[0], textLight[1], textLight[2]);
    doc.text(`GSTIN: ${purchase.gstin || "URD"}`, 18, supplierY + 14);

    yPos += 35;

    // --- Items Table ---
    const tableData = purchase.items.map((item: any, index: number) => [
        (index + 1).toString(),
        `${item.productName}\n[Type/Vol: ${item.sku}]`,
        item.hsn || "-",
        `${new Date(item.mfgDate).toLocaleDateString('en-IN', {month: '2-digit', year: '2-digit'})}/${new Date(item.expiryDate).toLocaleDateString('en-IN', {month: '2-digit', year: '2-digit'})}`,
        item.quantity.toString(),
        `Rs. ${item.rate.toFixed(2)}`,
        `${item.gstRate}%`,
        `Rs. ${item.total.toFixed(2)}`
    ]);

    autoTable(doc, {
        startY: yPos,
        head: [['#', 'Description', 'HSN', 'MFG/EXP', 'Qty', 'Rate', 'GST', 'Total']],
        body: tableData,
        theme: 'grid',
        headStyles: {
            fillColor: [240, 240, 240],
            textColor: textDark,
            fontStyle: 'bold',
            fontSize: 9,
            halign: 'center'
        },
        bodyStyles: {
            textColor: textDark,
            fontSize: 8,
            cellPadding: 4
        },
        columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 20, halign: 'center' },
            3: { cellWidth: 25, halign: 'center' },
            4: { cellWidth: 15, halign: 'center' },
            5: { cellWidth: 25, halign: 'right' },
            6: { cellWidth: 15, halign: 'center' },
            7: { cellWidth: 30, halign: 'right' },
        },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;

    // --- Financial Summary ---
    const totalsBoxWidth = 80;
    const totalsBoxX = pageWidth - totalsBoxWidth - 14;
    
    doc.setDrawColor(200, 200, 200);
    doc.rect(totalsBoxX, finalY, totalsBoxWidth, 40, 'D');

    let summaryY = finalY + 8;
    const paddingRight = pageWidth - 14 - 5;
    const labelX = totalsBoxX + 5;

    const addSummaryRow = (label: string, value: string, bold = false) => {
        doc.setFontSize(9);
        doc.setFont("helvetica", bold ? "bold" : "normal");
        doc.setTextColor(textLight[0], textLight[1], textLight[2]);
        doc.text(label, labelX, summaryY);
        doc.setTextColor(textDark[0], textDark[1], textDark[2]);
        doc.text(value, paddingRight, summaryY, { align: "right" });
        summaryY += 7;
    };

    addSummaryRow("Taxable Amount:", `Rs. ${purchase.taxableTotal?.toFixed(2)}`);
    
    const cgst = purchase.taxBreakup?.cgst || 0;
    const sgst = purchase.taxBreakup?.sgst || 0;
    const igst = purchase.taxBreakup?.igst || 0;

    if (cgst > 0) addSummaryRow("CGST:", `Rs. ${cgst.toFixed(2)}`);
    if (sgst > 0) addSummaryRow("SGST:", `Rs. ${sgst.toFixed(2)}`);
    if (igst > 0) addSummaryRow("IGST:", `Rs. ${igst.toFixed(2)}`);

    doc.line(totalsBoxX, summaryY - 2, pageWidth - 14, summaryY - 2);
    summaryY += 4;
    addSummaryRow("Grand Total:", `Rs. ${purchase.totalAmount?.toLocaleString()}`, true);

    // --- Footer ---
    const footerY = doc.internal.pageSize.getHeight() - 20;
    doc.setFontSize(8);
    doc.setTextColor(textLighter[0], textLighter[1], textLighter[2]);
    doc.text("Computer Generated Purchase Voucher - No Signature Required", pageWidth / 2, footerY, { align: "center" });

    doc.save(`Purchase_Invoice_${purchase.invoiceNo}.pdf`);
};
