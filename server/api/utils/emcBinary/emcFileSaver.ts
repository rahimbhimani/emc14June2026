// server/utils/emcBinary/emcFileSaver.ts

import crypto from "crypto";
import fs from "fs";
import path from "path";

function getExtFromFilename(filename?: string) {
  const ext = filename?.split(".").pop()?.toLowerCase();
  if (!ext) return "jpg";
  if (ext === "jpeg") return "jpg";
  if (["jpg", "png", "webp"].includes(ext)) return ext;
  return "jpg";
}

export function saveOneBinaryFileToUploads(filePart: any) {
  if (!filePart?.data) return null;

  const buffer = filePart.data;

  if (!Buffer.isBuffer(buffer) || buffer.length < 50) {
    console.log("❌ Invalid buffer received:", buffer?.length);
    return null;
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  const ext = getExtFromFilename(filePart.filename);
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const savePath = path.join(uploadDir, fileName);

  fs.writeFileSync(savePath, buffer);

  return `/uploads/${fileName}`;
}
