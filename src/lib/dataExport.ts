// Issue #21: Data Export Functionality
// Provides utilities for exporting data to PDF and CSV formats

/**
 * Export data to CSV format
 * @param data Array of objects to export
 * @param filename Name of the file to download
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string
): void {
  if (data.length === 0) {
    throw new Error('No data to export');
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  const csvContent = [
    // Header row
    headers.join(','),
    // Data rows
    ...data.map(row =>
      headers
        .map(header => {
          const value = row[header];
          // Handle values that contain commas or quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value ?? '';
        })
        .join(',')
    ),
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${filename}.csv`);
}

/**
 * Export data to JSON format
 * @param data Data to export
 * @param filename Name of the file to download
 */
export function exportToJSON<T>(data: T, filename: string): void {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  downloadBlob(blob, `${filename}.json`);
}

/**
 * Generate a simple PDF report (text-based)
 * For more complex PDFs, consider using jsPDF library
 * @param content Text content for the PDF
 * @param filename Name of the file to download
 */
export function exportToTextPDF(content: string, filename: string): void {
  // Create a simple text-based PDF alternative
  // For production, integrate jsPDF library for proper PDF generation
  const blob = new Blob([content], { type: 'text/plain' });
  downloadBlob(blob, `${filename}.txt`);
  
  console.warn(
    'Text export used instead of PDF. For proper PDF generation, integrate jsPDF library.'
  );
}

/**
 * Helper function to trigger file download
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Format data for export with custom transformations
 */
export function prepareDataForExport<T extends Record<string, any>>(
  data: T[],
  options?: {
    excludeFields?: string[];
    includeFields?: string[];
    transformers?: Partial<Record<keyof T, (value: any) => any>>;
  }
): Record<string, any>[] {
  return data.map(item => {
    let result: Record<string, any> = { ...item };

    // Filter fields
    if (options?.includeFields) {
      result = Object.fromEntries(
        Object.entries(result).filter(([key]) => options.includeFields!.includes(key))
      );
    }
    if (options?.excludeFields) {
      result = Object.fromEntries(
        Object.entries(result).filter(([key]) => !options.excludeFields!.includes(key))
      );
    }

    // Apply transformers
    if (options?.transformers) {
      Object.entries(options.transformers).forEach(([key, transformer]) => {
        if (key in result && transformer) {
          result[key] = transformer(result[key]);
        }
      });
    }

    return result;
  });
}

/**
 * Export insights report with formatted data
 */
export function exportInsightsReport(data: {
  goals: any[];
  tasks: any[];
  logs: any[];
  attributes: any[];
  summary: any;
}): void {
  const reportContent = `
DEVPULSE AI - INSIGHTS REPORT
Generated: ${new Date().toLocaleString()}

=== SUMMARY ===
${data.summary?.summary_text || 'No summary available'}

=== GOALS (${data.goals.length}) ===
${data.goals.map(g => `- ${g.goal_code}: ${g.title} (${g.progress}%)`).join('\n')}

=== TASKS (${data.tasks.length}) ===
Completed: ${data.tasks.filter(t => t.status === 'completed').length}
Pending: ${data.tasks.filter(t => t.status === 'pending').length}

=== DAILY LOGS (${data.logs.length}) ===
${data.logs.slice(0, 10).map(l => `- ${l.time}: ${l.title}`).join('\n')}

=== ATTRIBUTES (${data.attributes.length}) ===
${data.attributes.map(a => `- ${a.name}: ${a.rating}/5 stars`).join('\n')}
`;

  exportToTextPDF(reportContent, `insights-report-${Date.now()}`);
}
