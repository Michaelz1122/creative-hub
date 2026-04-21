import { createHash, randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { StorageError } from "@/lib/validation";

const RECEIPT_MAX_BYTES = 8 * 1024 * 1024;
const RECEIPT_ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

function getCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const folder = process.env.CLOUDINARY_RECEIPTS_FOLDER || "creative-hub/receipts";

  if (!cloudName || !apiKey || !apiSecret) {
    throw new StorageError("storage-not-configured", "Cloudinary is not configured.");
  }

  return {
    cloudName,
    apiKey,
    apiSecret,
    folder,
  };
}

function canUseLocalDevStorage() {
  return process.env.NODE_ENV !== "production";
}

async function storeReceiptFileLocally(file: File) {
  const extension = file.name.split(".").pop() || "png";
  const fileName = `receipt-${randomUUID()}.${extension}`;
  const relativeDirectory = join("public", "uploads", "receipts");
  const absoluteDirectory = join(process.cwd(), relativeDirectory);
  const absoluteFilePath = join(absoluteDirectory, fileName);

  await mkdir(absoluteDirectory, { recursive: true });
  await writeFile(absoluteFilePath, Buffer.from(await file.arrayBuffer()));

  return `/uploads/receipts/${fileName}`;
}

function createCloudinarySignature(input: {
  folder: string;
  publicId: string;
  timestamp: number;
  apiSecret: string;
}) {
  const payload = `folder=${input.folder}&public_id=${input.publicId}&timestamp=${input.timestamp}${input.apiSecret}`;
  return createHash("sha1").update(payload).digest("hex");
}

export function getReceiptUploadRules() {
  return {
    maxBytes: RECEIPT_MAX_BYTES,
    allowedMimeTypes: RECEIPT_ALLOWED_TYPES,
  };
}

export async function storeReceiptFile(file: File) {
  let cloudinaryConfig: ReturnType<typeof getCloudinaryConfig> | null = null;

  try {
    cloudinaryConfig = getCloudinaryConfig();
  } catch (error) {
    if (error instanceof StorageError && error.code === "storage-not-configured" && canUseLocalDevStorage()) {
      return storeReceiptFileLocally(file);
    }

    throw error;
  }

  const { cloudName, apiKey, apiSecret, folder } = cloudinaryConfig;
  const timestamp = Math.floor(Date.now() / 1000);
  const extension = file.name.split(".").pop() || "png";
  const publicId = `receipt-${randomUUID()}.${extension}`;
  const signature = createCloudinarySignature({
    folder,
    publicId,
    timestamp,
    apiSecret,
  });

  const body = new FormData();
  body.append("file", file);
  body.append("api_key", apiKey);
  body.append("timestamp", String(timestamp));
  body.append("folder", folder);
  body.append("public_id", publicId);
  body.append("signature", signature);

  let response: Response;
  try {
    response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body,
      cache: "no-store",
    });
  } catch {
    throw new StorageError("upload-unreachable", "Could not reach Cloudinary.");
  }

  if (!response.ok) {
    throw new StorageError("upload-failed", "Cloudinary upload failed.");
  }

  const payload = (await response.json()) as {
    secure_url?: string;
  };

  if (!payload.secure_url) {
    throw new StorageError("upload-invalid-response", "Cloudinary response did not include a secure URL.");
  }

  return payload.secure_url;
}
