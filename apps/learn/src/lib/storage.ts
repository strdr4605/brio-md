import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

const STORAGE_DRIVER = process.env.STORAGE_DRIVER || "local";
const S3_ENDPOINT = process.env.S3_ENDPOINT;
const S3_REGION = process.env.S3_REGION || "us-east-1";
const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID;
const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY;
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || "brio-media";
const S3_PUBLIC_URL = process.env.S3_PUBLIC_URL;

export type UploadFileInput = {
  buffer: Buffer | Uint8Array;
  filename: string;
  contentType: string;
};

export type UploadFileOutput = {
  url: string;
  key: string;
  size: number;
  contentType: string;
};

/**
 * Sanitizes a filename to keep only safe characters and avoid directory traversal
 */
export function sanitizeFilename(filename: string): string {
  const base = filename.replace(/^.*[\\/]/, "");
  return base
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, "-")
    .replace(/-+/g, "-");
}

/**
 * Uploads a file buffer either to S3/R2 (in production) or to local disk (in development).
 */
export async function uploadFileToStorage(
  input: UploadFileInput,
): Promise<UploadFileOutput> {
  const safeName = sanitizeFilename(input.filename);
  const key = `resources/${Date.now()}-${randomUUID().slice(0, 8)}-${safeName}`;

  if (STORAGE_DRIVER === "s3" && S3_ENDPOINT && S3_ACCESS_KEY_ID && S3_SECRET_ACCESS_KEY) {
    // @ts-ignore - optional dynamic s3 driver
    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
    const client = new S3Client({
      endpoint: S3_ENDPOINT,
      region: S3_REGION,
      credentials: {
        accessKeyId: S3_ACCESS_KEY_ID,
        secretAccessKey: S3_SECRET_ACCESS_KEY,
      },
      forcePathStyle: true,
    });

    await client.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: key,
        Body: input.buffer,
        ContentType: input.contentType,
      }),
    );

    const publicBase = S3_PUBLIC_URL || `${S3_ENDPOINT.replace(/\/$/, "")}/${S3_BUCKET_NAME}`;
    const publicUrl = `${publicBase.replace(/\/$/, "")}/${key}`;

    return {
      url: publicUrl,
      key,
      size: input.buffer.length,
      contentType: input.contentType,
    };
  }

  // Local filesystem driver (default for development and Docker dev)
  const uploadsDir = path.join(process.cwd(), "uploads", "resources");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const filePath = path.join(process.cwd(), "uploads", key);
  fs.writeFileSync(filePath, input.buffer);

  return {
    url: `/api/files/${key}`,
    key,
    size: input.buffer.length,
    contentType: input.contentType,
  };
}
