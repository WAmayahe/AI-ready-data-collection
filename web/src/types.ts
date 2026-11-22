export type Page = "overview" | "cameras" | "recordings" | "settings";

export type CameraStatus = "online" | "recording" | "offline";

export interface CameraDevice {
  id: string;
  name: string;
  model: string;
  status: CameraStatus;
  battery: number;
  camera: "Trước" | "Sau";
  lastSeen: string;
}

export interface Recording {
  id: string;
  title: string;
  cameraName: string;
  date: string;
  duration: string;
  size: string;
  status: "Hoàn tất" | "Đang tải";
}

export interface LoginResponse {
  user: {
    id: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
  };
  account_role: string;
  access_token: string;
  refresh_token: string;
  expires_in: number;
  device: {
    device_id: string;
    camera_name?: string;
  };
}
