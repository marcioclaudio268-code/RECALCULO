import { readFile } from "node:fs/promises";
import { parse } from "csv-parse/sync";

export type CsvRow = {
  lineNumber: number;
  values: Record<string, string>;
};

export type ParsedCsv = {
  headers: string[];
  rows: CsvRow[];
};

export async function parseSemicolonCsvFile(filePath: string): Promise<ParsedCsv> {
  const buffer = await readFile(filePath);
  const content = buffer.toString("utf8");

  const records = parse(content, {
    bom: true,
    delimiter: ";",
    relax_column_count: true,
    skip_empty_lines: true,
    trim: false
  }) as string[][];

  if (records.length === 0) {
    return {
      headers: [],
      rows: []
    };
  }

  const headers = records[0].map((header) => header.trim());
  const rows = records.slice(1).map((record, index) => {
    const values = Object.fromEntries(
      headers.map((header, headerIndex) => [header, record[headerIndex]?.trim() ?? ""])
    );

    return {
      lineNumber: index + 2,
      values
    };
  });

  return {
    headers,
    rows
  };
}
