import { apiRequest, isRecord } from "./api";

export interface RoomMemberResponse {
  member_id: string;
  camera_name: string;
  is_online: string;
}

export interface RoomResponse {
  room_id: string;
  invite_code: string;
  expires_at: string;
  created_at: string;
  members: RoomMemberResponse[];
}

export interface JoinRoomResponse {
  room_id: string;
  room_name: string;
  member_id: string;
  members: RoomMemberResponse[];
}

export async function createRoom(
  accessToken: string,
  roomName: string,
): Promise<RoomResponse> {
  return apiRequest(
    "/rooms",
    accessToken,
    {
      method: "POST",
      body: JSON.stringify({ room_name: roomName, max_members: 8 }),
    },
    parseRoom,
  );
}

export async function getRoomMembers(
  roomId: string,
  accessToken: string,
): Promise<RoomMemberResponse[]> {
  return apiRequest(
    `/rooms/${encodeURIComponent(roomId)}/members`,
    accessToken,
    { method: "GET" },
    parseMembers,
  );
}

export async function joinRoom(
  accessToken: string,
  inviteCode: string,
  deviceId: string,
  cameraName: string,
): Promise<JoinRoomResponse> {
  return apiRequest(
    "/rooms/join",
    accessToken,
    {
      method: "POST",
      body: JSON.stringify({
        invite_code: inviteCode,
        device_id: deviceId,
        camera_name: cameraName,
        grant_control: true,
      }),
    },
    parseJoinRoom,
  );
}

function parseRoom(value: unknown): RoomResponse {
  if (
    !isRecord(value) ||
    typeof value.room_id !== "string" ||
    typeof value.invite_code !== "string" ||
    typeof value.expires_at !== "string" ||
    typeof value.created_at !== "string"
  ) {
    throw new Error("Phản hồi tạo phòng thiếu thông tin cần thiết.");
  }
  return {
    room_id: value.room_id,
    invite_code: value.invite_code,
    expires_at: value.expires_at,
    created_at: value.created_at,
    members: parseMembers(value.members),
  };
}

function parseMembers(value: unknown): RoomMemberResponse[] {
  if (!Array.isArray(value)) {
    throw new Error("Server trả về danh sách thành viên không hợp lệ.");
  }

  return value.map((member) => {
    if (
      !isRecord(member) ||
      typeof member.member_id !== "string" ||
      typeof member.camera_name !== "string" ||
      typeof member.is_online !== "string"
    ) {
      throw new Error("Server trả về thông tin thành viên không hợp lệ.");
    }
    return {
      member_id: member.member_id,
      camera_name: member.camera_name,
      is_online: member.is_online,
    };
  });
}

function parseJoinRoom(value: unknown): JoinRoomResponse {
  if (
    !isRecord(value) ||
    typeof value.room_id !== "string" ||
    typeof value.room_name !== "string" ||
    typeof value.member_id !== "string"
  ) {
    throw new Error("Phản hồi tham gia phòng thiếu thông tin cần thiết.");
  }
  return {
    room_id: value.room_id,
    room_name: value.room_name,
    member_id: value.member_id,
    members: parseMembers(value.members),
  };
}
