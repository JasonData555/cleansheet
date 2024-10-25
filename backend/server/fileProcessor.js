import { parse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';

export const fileProcessor = {
  parseFile(buffer, filename) {
    if (filename.endsWith('.csv')) {
      return this.parseCSV(buffer);
    } else if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
      return this.parseExcel(buffer);
    }
    throw new Error('Unsupported file format');
  },

  parseCSV(buffer) {
    const content = buffer.toString('utf-8');
    return parse(content, {
      skip_empty_lines: true,
      trim: true
    });
  },

  parseExcel(buffer) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
  },

  generateFile(data, format = 'csv') {
    if (format === 'csv') {
      return Buffer.from(
        data.map(row => row.join(',')).join('\n')
      );
    } else if (format === 'xlsx') {
      const ws = XLSX.utils.aoa_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    }
    throw new Error('Unsupported output format');
  },

  getMimeType(format) {
    const mimeTypes = {
      csv: 'text/csv',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
    return mimeTypes[format] || 'application/octet-stream';
  }
};
