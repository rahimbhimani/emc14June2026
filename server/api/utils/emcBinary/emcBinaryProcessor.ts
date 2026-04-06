import crypto from "crypto";
import fs from "fs";
import path from "path";

function removeFormNamePrefix(dp: string) {
  if (!dp) return "";
  return dp.startsWith("FormName.") ? dp.replace("FormName.", "") : dp;
}

function ensurePath(obj: any, fullPath: string) {
  const keys = fullPath.split(".");
  let ref = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    if (!ref[k] || typeof ref[k] !== "object") ref[k] = {};
    ref = ref[k];
  }

  const lastKey = keys[keys.length - 1];
  return { ref, lastKey };
}

function getExt(filename?: string, mime?: string) {
  const ext = filename?.split(".").pop()?.toLowerCase();
  if (ext === "jpeg") return "jpg";
  if (ext && ["jpg", "png", "webp"].includes(ext)) return ext;

  const m = (mime || "").toLowerCase();
  if (m.includes("jpeg")) return "jpg";
  if (m.includes("png")) return "png";
  if (m.includes("webp")) return "webp";

  return "jpg";
}

function saveFileToUploads(filePart: any) {
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  const buffer = filePart?.data;
  if (!Buffer.isBuffer(buffer) || buffer.length < 50) {
    console.log("❌ Invalid file buffer:", buffer?.length);
    return null;
  }

  const ext = getExt(filePart?.filename, filePart?.type);
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const savePath = path.join(uploadDir, fileName);

  fs.writeFileSync(savePath, buffer);

  return `/uploads/${fileName}`;
}

/**
 * ✅ Updates body.data using datapath from body.BinaryData
 * datapath example: "FormName.gbImage.Image"
 *
 * Result at that datapath:
 * {
 *   imagePath: ["/uploads/..."],
 *   ImageType: ""
 * }
 */
export function processBinaryDataAccurate(body: any, filePartsRaw: any[]) {
  try {
    body = body || {};
    body.data = body.data || {};
    body.BinaryData = body.BinaryData || [];
    console.log("✅ processBinaryDataAccurate called with", filePartsRaw);
    for (let i = 0; i < filePartsRaw.length; i++) {

      const filePart = filePartsRaw[i];
      if (!filePart) continue;
      console.log("✅ Processing file part:", filePart.filename);
      const meta = body.BinaryData[i] || body.BinaryData[0];
      console.log("✅ Associated metadata:", meta);
      if (!meta?.datapath) continue;

      // ✅ save file
      const url = saveFileToUploads(filePart);
      console.log("✅ Saved file URL:", url);
      if (!url) continue;

      // ✅ locate path inside body.data
      const cleanPath = removeFormNamePrefix(meta.datapath);
      console.log("✅ Processing file for datapath:", cleanPath);
      const { ref, lastKey } = ensurePath(body.data, cleanPath);

      // ✅ overwrite property at datapath (ignore "[object File]" completely)
      const existing = ref[lastKey];

      if (existing && typeof existing === "object" && Array.isArray(existing.imagePath)) {
        existing.imagePath.push(url);
        if (existing.ImageType === undefined) existing.ImageType = "";
        ref[lastKey] = existing;
      } else {
        ref[lastKey] = {
          imagePath: [url],
          ImageType: "",
        };
      }
    }

    return body;
  } catch (err: any) {
    console.log("❌ processBinaryDataAccurate ERROR:", err?.message);
    return body;
  }
}
