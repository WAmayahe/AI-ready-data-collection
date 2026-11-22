export async function apiRequest<T>(
  path: string,
  accessToken: string,
  init: RequestInit,
  parseData: (value: unknown) => T,
): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...init.headers,
    },
  });

  let envelope: unknown;
  try {
    envelope = await response.json();
  } catch {
    throw new Error("Server trả về dữ liệu không hợp lệ.");
  }

  if (!isRecord(envelope)) {
    throw new Error("Server trả về dữ liệu không hợp lệ.");
  }

  const code = envelope.code;
  const message = typeof envelope.message === "string" ? envelope.message : "";
  if (!response.ok || code !== "1000") {
    throw new Error(message || `Yêu cầu thất bại (HTTP ${response.status}).`);
  }

  return parseData(envelope.data);
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
