import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const uploadRoot = path.join(process.cwd(), "public", "uploads", "receipts");

export async function storeReceiptFile(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const extension = file.name.split(".").pop() || "png";
  const filename = `${randomUUID()}.${extension}`;

  await mkdir(uploadRoot, { recursive: true });
  await writeFile(path.join(uploadRoot, filename), Buffer.from(arrayBuffer));

  return `/uploads/receipts/${filename}`;
}

