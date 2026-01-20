import Papa from 'papaparse';

export function parseCSV(csvText) {
  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => {
      // Map CSV headers to camelCase
      const headerMap = {
        'Item ID': 'id',
        'Name': 'name',
        'Image': 'image',
        'Drug Type': 'drugType',
        'Location': 'location',
        'Out_of_Stock': 'outOfStockText',
        'Notes': 'notes',
        'Barcode': 'barcode',
        'Barcode2': 'barcode2',
        'Barcode3': 'barcode3'
      };
      return headerMap[header] || header;
    }
  });

  // Transform and filter rows
  return result.data
    .filter(row => row.id && row.name) // Skip empty rows
    .map(row => ({
      id: row.id,
      name: row.name.trim() || '',
      drugType: row.drugType?.trim() || 'Uncategorized',
      location: row.location?.trim() || 'Unknown',
      outOfStock: row.outOfStockText === 'Out of Stock',
      notes: row.notes?.trim() || '',
      hasNotes: Boolean(row.notes && row.notes.trim()),
      image: row.image || null,
      barcodes: [row.barcode, row.barcode2, row.barcode3].filter(Boolean)
    }));
}
