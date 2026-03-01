import * as XLSX from 'xlsx';

export interface ExportColumn {
    header: string;
    key: string;
    width?: number;
    formatter?: (value: any) => any;
}

export const exportToExcel = (data: any[], columns: ExportColumn[], filename: string) => {
    // Transform data based on columns and formatters
    const worksheetData = data.map((item) => {
        const row: Record<string, any> = {};
        columns.forEach((col) => {
            const value = item[col.key];
            row[col.header] = col.formatter ? col.formatter(value) : value;
        });
        return row;
    });

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);

    // Apply column widths if provided
    if (columns.some(col => col.width)) {
        worksheet['!cols'] = columns.map(col => ({ wch: col.width || 10 }));
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos');

    // Export file
    XLSX.writeFile(workbook, `${filename}.xlsx`);
};
