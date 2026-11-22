import type { LoginResponse } from "../types";

interface LoginRequest {
  email?: string;
  phone?: string;
  password: string;
  device_id: string;
  device_type: 4;
  device_name: string;
}

function getDeviceId(accountIdentifier: string): string {
  const key = `multicam.web.device_id.${encodeURIComponent(accountIdentifier.toLowerCase())}`;
  const existingId = localStorage.getItem(key);
  if (existingId) return existingId;

  const deviceId = crypto.randomUUID();
  localStorage.setItem(key, deviceId);
  return deviceId;
}

export async function login(
  identifier: string,
  password: string,
): Promise<LoginResponse> {
  const payload: LoginRequest = {
    ...(identifier.includes("@") ? { email: identifier } : { phone: identifier }),
    password,
    device_id: getDeviceId(identifier.trim()),
    device_type: 4,
    device_name: "Web Controller",
  };

  const response = await fetch("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  let result: unknown;
  try {
    result = await response.json();
  } catch {
    throw new Error("Server trả về dữ liệu không hợp lệ.");
  }

  if (!isRecord(result)) {
    throw new Error("Server trả về dữ liệu không hợp lệ.");
  }

  const message = typeof result.message === "string" ? result.message : "";
  if (!response.ok || result.code !== "1000") {
    throw new Error(message || "Đăng nhập không thành công.");
  }

  if (!isRecord(result.data)) {
    throw new Error("Phản hồi đăng nhập thiếu dữ liệu tài khoản.");
  }

  const data = result.data;
  const accountRole = data.account_role;
  if (accountRole !== "controller" && accountRole !== "remote") {
    throw new Error("Tài khoản có vai trò không hợp lệ.");
  }

  const user = data.user;
  const device = data.device;
  const accessToken = data.access_token;
  const refreshToken = data.refresh_token;
  const expiresIn = data.expires_in;
  if (
    typeof accessToken !== "string" ||
    typeof refreshToken !== "string" ||
    typeof expiresIn !== "number" ||
    !isRecord(user) ||
    !isRecord(device)
  ) {
    throw new Error("Phản hồi đăng nhập thiếu thông tin cần thiết.");
  }

  const userId = user.id;
  const deviceId = device.device_id;
  if (typeof userId !== "string" || typeof deviceId !== "string") {
    throw new Error("Phản hồi đăng nhập thiếu thông tin cần thiết.");
  }

  return {
    user: {
      id: userId,
      first_name: typeof user.first_name === "string" ? user.first_name : undefined,
      last_name: typeof user.last_name === "string" ? user.last_name : undefined,
      email: typeof user.email === "string" ? user.email : undefined,
      phone: typeof user.phone === "string" ? user.phone : undefined,
    },
    account_role: accountRole,
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: expiresIn,
    device: {
      device_id: deviceId,
      camera_name:
        typeof device.camera_name === "string" ? device.camera_name : undefined,
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
