import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const downloadPayslipPDF = (employeeSlip: any, monthYear: string, action: 'download' | 'print' = 'download') => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // --- Fonts and Colors ---
    const primaryColor: [number, number, number] = [248, 128, 14]; // Brand Orange
    const textDark: [number, number, number] = [0, 0, 0]; // Black
    const textLight: [number, number, number] = [60, 60, 60]; // Dark gray
    const textLighter: [number, number, number] = [100, 100, 100]; // Mid gray

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
    doc.setFontSize(24);
    doc.text("SALARY SLIP", pageWidth - 14, yPos, { align: "right" });

    yPos += 12;

    // Employee Details (Left)
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(employeeSlip.employeeName || "Employee", 14, yPos);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(textLight[0], textLight[1], textLight[2]);
    doc.text(`Emp ID: ${employeeSlip.employeeId || "N/A"}`, 14, yPos + 6);
    doc.text(`Designation: ${employeeSlip.designation || "N/A"}`, 14, yPos + 12);
    doc.text(`Department: ${employeeSlip.department || "N/A"}`, 14, yPos + 18);

    // Slip Info (Right)
    const addMetaRow = (key: string, value: string, y: number) => {
        doc.setFont("helvetica", "bold");
        doc.text(key, pageWidth - 80, y);
        doc.setFont("helvetica", "normal");
        doc.text(String(value), pageWidth - 14, y, { align: "right" });
    };

    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    addMetaRow("Pay Period:", monthYear || "N/A", yPos);
    addMetaRow("Status:", employeeSlip.status || "Posted", yPos + 6);
    addMetaRow("Bank:", employeeSlip.bankName || "—", yPos + 12);
    addMetaRow("A/C No:", employeeSlip.accountNumber ? `****${employeeSlip.accountNumber.slice(-4)}` : "—", yPos + 18);
    addMetaRow("IFSC:", employeeSlip.ifsc || "—", yPos + 24);

    yPos += 30;

    // --- Divider ---
    doc.setDrawColor(200, 200, 200);
    doc.line(14, yPos, pageWidth - 14, yPos);
    yPos += 8;

    // --- Earnings & Deductions Tables ---
    const basic = employeeSlip.basicSalary || employeeSlip.earnings?.basic || 0;
    const hra = employeeSlip.hra || employeeSlip.earnings?.hra || 0;
    const allowances = employeeSlip.otherAllowances || employeeSlip.earnings?.allowances || 0;
    const gross = employeeSlip.grossSalary || employeeSlip.earnings?.grossPay || 0;
    
    const tds = employeeSlip.deductions?.tds || 0;
    const pf = employeeSlip.deductions?.pf || 0;
    const esic = employeeSlip.deductions?.esic || 0;
    const totalDeductions = tds + pf + esic;
    
    const netPay = employeeSlip.netSalary || employeeSlip.netPay || 0;

    const tableData = [
        [{ content: 'Earnings', colSpan: 2, styles: { fontStyle: 'bold' as const, fillColor: [240, 240, 240] as [number, number, number] } }],
        ['Basic Salary', `Rs. ${basic.toLocaleString()}`],
        ['House Rent Allowance (HRA)', `Rs. ${hra.toLocaleString()}`],
        ['Other Allowances', `Rs. ${allowances.toLocaleString()}`],
        [{ content: 'Gross Earnings', styles: { fontStyle: 'bold' as const } }, { content: `Rs. ${gross.toLocaleString()}`, styles: { fontStyle: 'bold' as const } }],
        
        [{ content: 'Deductions', colSpan: 2, styles: { fontStyle: 'bold' as const, fillColor: [240, 240, 240] as [number, number, number] } }],
        ['Tax Deducted at Source (TDS)', `Rs. ${tds.toLocaleString()}`],
        ['Provident Fund (PF)', `Rs. ${pf.toLocaleString()}`],
        ['Employee State Insurance (ESIC)', `Rs. ${esic.toLocaleString()}`],
        [{ content: 'Total Deductions', styles: { fontStyle: 'bold' as const } }, { content: `Rs. ${totalDeductions.toLocaleString()}`, styles: { fontStyle: 'bold' as const } }],
    ];

    autoTable(doc, {
        startY: yPos,
        body: tableData,
        theme: 'grid', // Great for print
        styles: {
            textColor: textDark,
            fontSize: 10,
            lineColor: [200, 200, 200],
            lineWidth: 0.1,
            cellPadding: 6,
        },
        columnStyles: {
            0: { cellWidth: 'auto' },
            1: { cellWidth: 50, halign: 'right' },
        },
        alternateRowStyles: {
            fillColor: [255, 255, 255]
        }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 15;

    // --- Net Pay Section ---
    doc.setFillColor(252, 252, 252);
    doc.setDrawColor(200, 200, 200);
    // Draw clear box for the grand total summary instead of relying on solid fills
    doc.rect(14, finalY, pageWidth - 28, 20, 'FD'); 

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text("NET PAY", 20, finalY + 13);
    
    doc.setFontSize(14);
    // Printed clearly in black
    doc.text(`Rs. ${netPay.toLocaleString()}`, pageWidth - 20, finalY + 14, { align: "right" });

    // --- Footer ---
    const footerY = doc.internal.pageSize.getHeight() - 15;
    
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.5);
    doc.line(14, footerY - 5, pageWidth - 14, footerY - 5);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(textLighter[0], textLighter[1], textLighter[2]);
    const footerText = "Subject to Mumbai Jurisdiction. This is a computer-generated payslip and needs no signature.";
    doc.text(footerText, pageWidth / 2, footerY + 2, { align: "center" });

    // Output
    if (action === 'print') {
        doc.autoPrint();
        const blob = doc.output('blob');
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
    } else {
        doc.save(`Payslip_${employeeSlip.employeeId || "Employee"}_${monthYear}.pdf`);
    }
};
