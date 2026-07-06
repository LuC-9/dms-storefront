import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { errorResponse } from "@/lib/api";
import { prisma } from "@/lib/prisma";

type CsvRow = Record<string, string | undefined>;

const EXPECTED_HEADERS = [
  "name",
  "slug",
  "description",
  "priceInPaise",
  "imageUrl",
  "sku",
  "hsn",
  "inStock",
  "stockCount",
  "categoryName",
] as const;

/**
 * Parse a single CSV line respecting double-quote escaping.
 * Returns an array of field strings.
 */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let i = 0;

  while (i <= line.length) {
    if (i === line.length) {
      // End of line — push empty field only when we had a trailing comma
      break;
    }

    if (line[i] === '"') {
      // Quoted field
      i++; // skip opening quote
      let field = "";
      while (i < line.length) {
        if (line[i] === '"') {
          if (line[i + 1] === '"') {
            // Escaped quote
            field += '"';
            i += 2;
          } else {
            // Closing quote
            i++;
            break;
          }
        } else {
          field += line[i];
          i++;
        }
      }
      fields.push(field);
      // Skip comma separator
      if (line[i] === ",") i++;
    } else {
      // Unquoted field — read until comma
      const start = i;
      while (i < line.length && line[i] !== ",") {
        i++;
      }
      fields.push(line.slice(start, i));
      if (line[i] === ",") i++;
    }
  }

  return fields;
}

/**
 * Parse full CSV text into array of objects keyed by headers.
 * Returns { headers, rows } where rows are raw string maps.
 */
function parseCsv(text: string): { headers: string[]; rows: CsvRow[] } {
  // Normalize line endings
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");

  const nonEmpty = lines.filter((l) => l.trim() !== "");
  if (nonEmpty.length === 0) return { headers: [], rows: [] };

  const headers = parseCsvLine(nonEmpty[0]);
  const rows: CsvRow[] = [];

  for (let i = 1; i < nonEmpty.length; i++) {
    const fields = parseCsvLine(nonEmpty[i]);
    const row: CsvRow = {};
    headers.forEach((h, idx) => {
      row[h] = fields[idx] ?? "";
    });
    rows.push(row);
  }

  return { headers, rows };
}

function parseBool(value: string): boolean {
  return value.trim().toLowerCase() === "true" || value.trim() === "1";
}

function parseOptionalInt(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "" || trimmed === "null") return null;
  const n = Number.parseInt(trimmed, 10);
  return Number.isFinite(n) ? n : null;
}

export async function POST(request: NextRequest) {
  const session = await requireAdminSession("SUPER_ADMIN", "ADMIN");
  if (!session) {
    return errorResponse("FORBIDDEN", "Insufficient role", 403);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse("BAD_REQUEST", "Expected multipart/form-data", 400);
  }

  const file = formData.get("file");
  if (!file || typeof file === "string") {
    return errorResponse("BAD_REQUEST", "Missing file field", 400);
  }

  const text = await file.text();
  const { headers, rows } = parseCsv(text);

  // Validate that all expected columns are present
  const missingHeaders = EXPECTED_HEADERS.filter((h) => !headers.includes(h));
  if (missingHeaders.length > 0) {
    return errorResponse(
      "BAD_REQUEST",
      `CSV is missing required columns: ${missingHeaders.join(", ")}`,
      400,
    );
  }

  if (rows.length === 0) {
    return NextResponse.json({ created: 0, updated: 0, skipped: 0, errors: [] });
  }

  // Cache categories (case-insensitive lookup)
  const allCategories = await prisma.category.findMany({ select: { id: true, name: true } });
  const categoryMap = new Map(allCategories.map((c) => [c.name.toLowerCase(), c.id]));

  let created = 0;
  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (let idx = 0; idx < rows.length; idx++) {
    const rowNum = idx + 2; // 1-indexed, accounting for header row
    const row: CsvRow = rows[idx];

    const categoryId = categoryMap.get((row["categoryName"] ?? "").trim().toLowerCase());
    if (!categoryId) {
      errors.push(`Row ${rowNum}: Category "${row["categoryName"] ?? ""}" not found — skipped`);
      skipped++;
      continue;
    }

    const slug = (row["slug"] ?? "").trim();
    const name = (row["name"] ?? "").trim();
    const description = (row["description"] ?? "").trim();
    const imageUrl = (row["imageUrl"] ?? "").trim();

    if (!slug || !name || !description || !imageUrl) {
      errors.push(`Row ${rowNum}: Missing required field (name, slug, description, imageUrl) — skipped`);
      skipped++;
      continue;
    }

    const priceInPaise = Number.parseInt((row["priceInPaise"] ?? "").trim(), 10);
    if (!Number.isFinite(priceInPaise) || priceInPaise <= 0) {
      errors.push(`Row ${rowNum}: Invalid priceInPaise "${row["priceInPaise"] ?? ""}" — skipped`);
      skipped++;
      continue;
    }

    const inStock = parseBool(row["inStock"] ?? "");
    const stockCount = parseOptionalInt(row["stockCount"] ?? "");
    const sku = (row["sku"] ?? "").trim() || null;
    const hsn = (row["hsn"] ?? "").trim() || null;

    try {
      const existing = await prisma.product.findUnique({ where: { slug } });

      if (existing) {
        await prisma.product.update({
          where: { slug },
          data: {
            name,
            description,
            priceInPaise,
            imageUrl,
            sku,
            hsn,
            inStock,
            stockCount,
            categoryId,
          },
        });
        updated++;
      } else {
        await prisma.product.create({
          data: {
            name,
            slug,
            description,
            priceInPaise,
            imageUrl,
            sku,
            hsn,
            inStock,
            stockCount,
            categoryId,
          },
        });
        created++;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`Row ${rowNum}: Database error — ${message}`);
      skipped++;
    }
  }

  return NextResponse.json({ created, updated, skipped, errors });
}
