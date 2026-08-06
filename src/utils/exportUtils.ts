export const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
        return;
    }

    try {
        const headers = Object.keys(data[0]);

        // Convert object array to CSV string efficiently
        const csvRows = [headers.join(',')];

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const values = headers.map(header => {
                let cell = row[header] === null || row[header] === undefined ? '' : row[header];
                const str = String(cell).replace(/"/g, '""');
                return str.includes(',') || str.includes('\n') || str.includes('"') ? `"${str}"` : str;
            });
            csvRows.push(values.join(','));
        }

        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.setAttribute('href', url);
        link.setAttribute('download', `${filename.replace(/\s+/g, '_')}.csv`);
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();

        setTimeout(() => {
            if (document.body.contains(link)) {
                document.body.removeChild(link);
            }
            URL.revokeObjectURL(url);
        }, 200);
    } catch (e) {
        console.error("Export CSV error:", e);
    }
};
