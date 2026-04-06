// server/utils/emcBinary/emcPathUtils.ts

export function removeFormNamePrefix(dp: string) {
  if (!dp) return "";
  return dp.startsWith("FormName.") ? dp.replace("FormName.", "") : dp;
}

// ✅ generic rule for ANY control:
// if datapath ends with ".Image" => push URL inside ".Image.imagePath"
export function normalizeTargetPath(dp: string) {
  let clean = removeFormNamePrefix(dp);

  if (clean.endsWith(".Image")) {
    clean = clean + ".imagePath";
  }

  return clean;
}

export function ensurePath(obj: any, fullPath: string) {
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

export function getValueByPath(obj: any, fullPath: string) {
  if (!obj || !fullPath) return undefined;

  const keys = fullPath.split(".");
  let ref = obj;

  for (const k of keys) {
    if (ref == null) return undefined;
    ref = ref[k];
  }

  return ref;
}

export function deleteByPath(obj: any, fullPath: string) {
  const { ref, lastKey } = ensurePath(obj, fullPath);
  if (ref && Object.prototype.hasOwnProperty.call(ref, lastKey)) {
    delete ref[lastKey];
  }
}

export function pushUrlAtPath(obj: any, fullPath: string, value: any) {
  const { ref, lastKey } = ensurePath(obj, fullPath);

  if (!Array.isArray(ref[lastKey])) {
    ref[lastKey] = [];
  }

  ref[lastKey].push(value);
}

export function setValueByPath(obj: any, fullPath: string, value: any) {
  const { ref, lastKey } = ensurePath(obj, fullPath);
  ref[lastKey] = value;
}

// Example: x.y.Image.imagePath -> x.y.Image.ImageType
export function setImageTypeNearPath(obj: any, imagePath: string, value: string) {
  if (!imagePath.endsWith("imagePath")) return;

  const typePath = imagePath.replace(/imagePath$/, "ImageType");
  const currentValue = getValueByPath(obj, typePath);

  if (currentValue === undefined) {
    setValueByPath(obj, typePath, value);
  }
}
