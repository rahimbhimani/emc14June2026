import type { H3Event } from "h3";

export function getRequestType(event: H3Event) {
  const contentType = event.node.req.headers["content-type"] || "";

  if (contentType.includes("multipart/form-data")) return "multipart";
  if (contentType.includes("application/json")) return "json";

  return "unknown";
}
