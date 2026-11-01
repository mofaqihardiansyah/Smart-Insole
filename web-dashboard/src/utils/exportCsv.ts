/**
 * CSV download, shared by the dashboard and the history page so the two exports
 * cannot drift apart.
 *
 * Two details matter and are easy to lose:
 *  - Every cell is quoted and internal quotes are doubled, so a value that
 *    contains a comma or a quote cannot shift the columns.
 *  - The file starts with a UTF-8 BOM, which is what makes Excel open an
 *    Indonesian or English export with the right encoding instead of mojibake.
 */

export const csvCell = (value: unknown): string =>
  `"${String(value ?? '').replace(/"/g, '""')}"`;

/**
 * @param filename download name, including the .csv extension
 * @param header column labels
 * @param rows cell values, already formatted
 */
export const downloadCsv = (
  filename: string,
  header: string[],
  rows: Array<Array<string | number>>
): void => {
  const lines = [header.map(csvCell).join(',')];
  rows.forEach((row) => lines.push(row.map(csvCell).join(',')));

  const csv = `\uFEFF${lines.join('\r\n')}\r\n`;
  const objectUrl = URL.createObjectURL(
    new Blob([csv], { type: 'text/csv;charset=utf-8' })
  );

  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
};

/** `YYYY-MM-DD`, so successive exports do not overwrite one another. */
export const dateStamp = (): string => new Date().toISOString().slice(0, 10);

export default downloadCsv;
