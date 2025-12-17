// Export Utilities - CSV and JSON export functions

/**
 * Convert array of objects to CSV format
 * @param {Array} data - Array of objects to convert
 * @param {Array} columns - Array of column definitions {key, label}
 * @returns {string} CSV formatted string
 */
export const convertToCSV = (data, columns) => {
  if (!data || data.length === 0) return '';

  // Create header row
  const headers = columns.map(col => col.label || col.key).join(',');
  
  // Create data rows
  const rows = data.map(item => {
    return columns.map(col => {
      let value = item[col.key];
      
      // Handle nested objects (e.g., machineId.name)
      if (col.key.includes('.')) {
        const keys = col.key.split('.');
        value = keys.reduce((obj, key) => obj?.[key], item);
      }
      
      // Format value
      if (value === null || value === undefined) {
        return '';
      }
      
      // Handle dates
      if (col.type === 'date' && value) {
        value = new Date(value).toLocaleDateString();
      }
      
      // Handle arrays
      if (Array.isArray(value)) {
        value = value.length;
      }
      
      // Handle objects
      if (typeof value === 'object' && value !== null) {
        value = JSON.stringify(value);
      }
      
      // Escape commas and quotes
      value = String(value).replace(/"/g, '""');
      
      // Wrap in quotes if contains comma, newline, or quote
      if (value.includes(',') || value.includes('\n') || value.includes('"')) {
        value = `"${value}"`;
      }
      
      return value;
    }).join(',');
  }).join('\n');
  
  return `${headers}\n${rows}`;
};

/**
 * Download data as CSV file
 * @param {Array} data - Array of objects to export
 * @param {Array} columns - Array of column definitions
 * @param {string} filename - Name of the file (without extension)
 */
export const downloadCSV = (data, columns, filename = 'export') => {
  const csv = convertToCSV(data, columns);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

/**
 * Download data as JSON file
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Name of the file (without extension)
 */
export const downloadJSON = (data, filename = 'export') => {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.json`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

/**
 * Print data as formatted table
 * @param {Array} data - Array of objects to print
 * @param {Array} columns - Array of column definitions
 * @param {string} title - Title for the print page
 */
export const printData = (data, columns, title = 'Data Export') => {
  const printWindow = window.open('', '_blank');
  
  // Create HTML table
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
        }
        h1 {
          color: #333;
          margin-bottom: 20px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 12px;
          text-align: left;
        }
        th {
          background-color: #667eea;
          color: white;
          font-weight: bold;
        }
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        .print-info {
          margin-top: 20px;
          font-size: 12px;
          color: #666;
        }
        @media print {
          .no-print {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <p class="print-info">Generated on: ${new Date().toLocaleString()}</p>
      <table>
        <thead>
          <tr>
            ${columns.map(col => `<th>${col.label || col.key}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.map(item => `
            <tr>
              ${columns.map(col => {
                let value = item[col.key];
                
                // Handle nested objects
                if (col.key.includes('.')) {
                  const keys = col.key.split('.');
                  value = keys.reduce((obj, key) => obj?.[key], item);
                }
                
                // Format value
                if (value === null || value === undefined) {
                  return '<td>-</td>';
                }
                
                // Handle dates
                if (col.type === 'date' && value) {
                  value = new Date(value).toLocaleDateString();
                }
                
                // Handle arrays
                if (Array.isArray(value)) {
                  value = `${value.length} items`;
                }
                
                // Handle objects
                if (typeof value === 'object' && value !== null) {
                  value = JSON.stringify(value);
                }
                
                return `<td>${value}</td>`;
              }).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="no-print" style="margin-top: 20px;">
        <button onclick="window.print()" style="padding: 10px 20px; background-color: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer;">Print</button>
        <button onclick="window.close()" style="padding: 10px 20px; background-color: #ccc; color: black; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">Close</button>
      </div>
    </body>
    </html>
  `;
  
  printWindow.document.write(html);
  printWindow.document.close();
};
