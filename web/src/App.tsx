import { useState, type FormEvent } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Icon, type IconName } from "./components/Icon";
import { login } from "./services/auth";
import { createRoom as createRoomApi, getRoomMembers, joinRoom, type JoinRoomResponse } from "./services/rooms";
import type { CameraDevice, Page, Recording } from "./types";

const initialCameras: CameraDevice[] = [
  {
    id: "cam-01",
    name: "Camera chính",
    model: "Samsung Galaxy S23",
    status: "online",
    battery: 86,
    camera: "Sau",
    lastSeen: "Vừa xong",
  },
  {
    id: "cam-02",
    name: "Camera góc rộng",
    model: "Google Pixel 7",
    status: "online",
    battery: 64,
    camera: "Trước",
    lastSeen: "Vừa xong",
  },
  {
    id: "cam-03",
    name: "Camera cận cảnh",
    model: "Xiaomi 13",
    status: "offline",
    battery: 21,
    camera: "Sau",
    lastSeen: "5 phút trước",
  },
];

const initialRecordings: Recording[] = [
  {
    id: "vid-1038",
    title: "Buổi ghi hình — góc rộng",
    cameraName: "Camera góc rộng",
    date: "Hôm nay, 14:32",
    duration: "00:02:48",
    size: "184 MB",
    status: "Hoàn tất",
  },
  {
    id: "vid-1037",
    title: "Buổi ghi hình — camera chính",
    cameraName: "Camera chính",
    date: "Hôm nay, 14:32",
    duration: "00:02:47",
    size: "231 MB",
    status: "Hoàn tất",
  },
  {
    id: "vid-1036",
    title: "Thử nghiệm ánh sáng",
    cameraName: "Camera cận cảnh",
    date: "Hôm qua, 16:08",
    duration: "00:01:16",
    size: "92 MB",
    status: "Hoàn tất",
  },
];

const navigation: { id: Page; label: string; icon: IconName }[] = [
  { id: "overview", label: "Tổng quan", icon: "grid" },
  { id: "cameras", label: "Thiết bị", icon: "camera" },
  { id: "recordings", label: "Thư viện video", icon: "video" },
  { id: "settings", label: "Cài đặt", icon: "settings" },
];

const pageTitles: Record<Page, string> = {
  overview: "Tổng quan",
  cameras: "Thiết bị",
  recordings: "Thư viện video",
  settings: "Cài đặt",
};

function createInviteCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function App() {
  const [page, setPage] = useState<Page>("overview");
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accountRole, setAccountRole] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [toast, setToast] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const onlineCount = cameras.filter((camera) => camera.status !== "offline").length;
  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError("");
    setIsLoggingIn(true);
    try {
      const result = await login(email.trim(), password);
      setAccessToken(result.access_token);
      setDeviceId(result.device.device_id);
      setAccountRole(result.account_role);
      setIsDemo(false);
      setCameras([]);
      setRecordings([]);
      setInviteCode(null);
      setRoomId(null);
      setIsAuthenticated(true);
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Không thể đăng nhập.");
    } finally {
      setIsLoggingIn(false);
    }
  }

  function enterDemo() {
    setIsDemo(true);
    setIsAuthenticated(true);
    setAccountRole("controller");
    setCameras(initialCameras);
    setRecordings(initialRecordings);
    setInviteCode(null);
    setRoomId(null);
    setIsRecording(false);
  }

  function logout() {
    setIsAuthenticated(false);
    setIsDemo(false);
    setAccountRole(null);
    setAccessToken("");
    setDeviceId("");
    setPassword("");
    setInviteCode(null);
    setRoomId(null);
    setCameras([]);
    setRecordings([]);
  }

  async function createRoom() {
    if (inviteCode) {
      notify("Phòng hiện tại vẫn đang mở.");
      return;
    }
    if (isDemo) {
      setInviteCode(createInviteCode());
      notify("Đã tạo phòng demo. Kết nối API để tạo phòng thật.");
      return;
    }

    setIsCreatingRoom(true);
    try {
      const room = await createRoomApi(accessToken, "Phòng ghi hình");
      setInviteCode(room.invite_code);
      setRoomId(room.room_id);
      const members = await getRoomMembers(room.room_id, accessToken);
      setCameras(members.map((member) => ({
        id: member.member_id,
        name: member.camera_name,
        model: "Remote Camera",
        status: member.is_online === "1" ? "online" : "offline",
        battery: 100,
        camera: "Sau",
        lastSeen: "Vừa tham gia",
      })));
      notify("Đã tạo phòng thành công.");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Không thể tạo phòng.");
    } finally {
      setIsCreatingRoom(false);
    }
  }

  async function refreshCameras() {
    if (isDemo) {
      notify("Danh sách thiết bị demo đã được làm mới.");
      return;
    }
    if (!roomId) {
      notify("Hãy tạo phòng trước khi tải danh sách thành viên.");
      return;
    }
    try {
      const members = await getRoomMembers(roomId, accessToken);
      setCameras(members.map((member) => ({
        id: member.member_id,
        name: member.camera_name,
        model: "Remote Camera",
        status: member.is_online === "1" ? "online" : "offline",
        battery: 100,
        camera: "Sau",
        lastSeen: "Vừa tham gia",
      })));
    } catch (error) {
      notify(error instanceof Error ? error.message : "Không thể tải danh sách thiết bị.");
    }
  }

  async function copyInviteCode() {
    if (!inviteCode) return;
    try {
      await navigator.clipboard.writeText(inviteCode);
      notify("Đã sao chép mã mời.");
    } catch {
      notify(`Mã phòng: ${inviteCode}`);
    }
  }

  function toggleRecording() {
    if (!isDemo) {
      notify("Điều khiển Start/Stop sẽ được tích hợp ở tuần 3.");
      return;
    }
    setIsRecording((current) => !current);
    setCameras((current) =>
      current.map((camera) =>
        camera.status === "offline"
          ? camera
          : { ...camera, status: isRecording ? "online" : "recording" },
      ),
    );
    notify(
      isRecording
        ? "Đã dừng quay trên các camera demo."
        : "Đã gửi lệnh bắt đầu quay trong chế độ demo.",
    );
  }

  function toggleCamera(cameraId: string) {
    if (!isDemo) {
      notify("Điều khiển camera trước/sau chưa được tích hợp.");
      return;
    }
    setCameras((current) =>
      current.map((camera) =>
        camera.id === cameraId
          ? { ...camera, camera: camera.camera === "Sau" ? "Trước" : "Sau" }
          : camera,
      ),
    );
    notify("Đã đổi camera trong giao diện demo.");
  }

  function deleteRecording(recordingId: string) {
    setRecordings((current) => current.filter((item) => item.id !== recordingId));
    notify("Đã xóa video khỏi danh sách demo.");
  }

  if (!isAuthenticated) {
    return (
      <LoginScreen
        email={email}
        password={password}
        error={loginError}
        isLoading={isLoggingIn}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onSubmit={handleLogin}
        onDemo={enterDemo}
      />
    );
  }

  if (accountRole === "remote") {
    return <RemoteJoinScreen accessToken={accessToken} deviceId={deviceId} onLogout={logout} />;
  }

  return (
    <div className="app-shell">
      {mobileNavOpen && (
        <button
          className="mobile-backdrop"
          aria-label="Đóng menu"
          onClick={() => setMobileNavOpen(false)}
        />
      )}
      <aside className={`sidebar ${mobileNavOpen ? "sidebar--open" : ""}`}>
        <div className="brand">
          <div className="brand-mark"><Icon name="camera" size={21} /></div>
          <div>
            <strong>multi<span>cam</span></strong>
            <small>RECORDER CONSOLE</small>
          </div>
          <button className="icon-button sidebar-close" aria-label="Đóng menu" onClick={() => setMobileNavOpen(false)}>
            <Icon name="close" />
          </button>
        </div>

        <div className="workspace-label">WORKSPACE</div>
        <div className="workspace-switcher">
          <div className="workspace-avatar">S</div>
          <div className="workspace-copy"><strong>Studio của bạn</strong><span>Controller</span></div>
          <Icon name="chevron" size={16} className="muted-icon" />
        </div>

        <nav className="nav-list" aria-label="Điều hướng chính">
          {navigation.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${page === item.id ? "nav-item--active" : ""}`}
              onClick={() => {
                setPage(item.id);
                setMobileNavOpen(false);
              }}
            >
              <Icon name={item.icon} size={19} />
              <span>{item.label}</span>
              {item.id === "cameras" && <span className="nav-count">{onlineCount}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon">?</div>
            <strong>Cần trợ giúp?</strong>
            <p>Xem hướng dẫn kết nối camera từ điện thoại.</p>
            <button onClick={() => notify("Hướng dẫn sẽ được bổ sung sau.")}>Xem hướng dẫn <Icon name="arrow" size={15} /></button>
          </div>
          <div className="profile-row">
            <div className="profile-avatar">CT</div>
            <div className="profile-copy"><strong>Controller</strong><span>{isDemo ? "Chế độ demo" : "Đang đăng nhập"}</span></div>
            <button className="icon-button logout-button" aria-label="Đăng xuất" onClick={logout}><Icon name="logout" size={18} /></button>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button className="icon-button menu-button" aria-label="Mở menu" onClick={() => setMobileNavOpen(true)}><Icon name="menu" /></button>
          <div className="breadcrumbs"><span>Workspace</span><Icon name="chevron" size={14} /><strong>{pageTitles[page]}</strong></div>
          <div className="topbar-right">
            {isDemo && <span className="demo-pill"><span /> DEMO MODE</span>}
            <div className={`connection-pill ${isDemo ? "connection-pill--demo" : ""}`}><span className="connection-dot" /> {isDemo ? "Backend chưa kết nối" : "Đã đăng nhập"}</div>
            <button className="help-button" onClick={() => notify("Trợ giúp sẽ được bổ sung sau.")}>Trợ giúp</button>
            <div className="top-avatar">CT</div>
          </div>
        </header>

        <div className="page-content">
          {page === "overview" && (
            <OverviewPage
              inviteCode={inviteCode}
              cameras={cameras}
              recordings={recordings}
              isRecording={isRecording}
              isDemo={isDemo}
              isCreatingRoom={isCreatingRoom}
              onCreateRoom={createRoom}
              onCopyCode={copyInviteCode}
              onToggleRecording={toggleRecording}
              onGoToCameras={() => setPage("cameras")}
              onGoToRecordings={() => setPage("recordings")}
              onRefreshCameras={refreshCameras}
            />
          )}
          {page === "cameras" && (
            <CamerasPage cameras={cameras} isDemo={isDemo} onFlip={toggleCamera} />
          )}
          {page === "recordings" && (
            <RecordingsPage recordings={recordings} isDemo={isDemo} onDelete={deleteRecording} />
          )}
          {page === "settings" && (
            <SettingsPage isDemo={isDemo} onLogout={logout} onNotify={notify} />
          )}
        </div>
      </main>
      {toast && <div className="toast"><span className="toast-check"><Icon name="check" size={15} /></span>{toast}</div>}
      <span className="sr-only">Phiên đăng nhập {accessToken ? "đã xác thực" : "chưa xác thực"}.</span>
    </div>
  );
}

interface LoginScreenProps {
  email: string;
  password: string;
  error: string;
  isLoading: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onDemo: () => void;
}

function LoginScreen({
  email,
  password,
  error,
  isLoading,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onDemo,
}: LoginScreenProps) {
  const [forgotNotice, setForgotNotice] = useState("");
  return (
    <main className="login-layout">
      <section className="login-showcase">
        <div className="login-brand"><span className="brand-mark"><Icon name="camera" size={21} /></span><strong>multi<span>cam</span></strong></div>
        <div className="showcase-content">
          <div className="eyebrow"><span className="eyebrow-line" /> MULTI-CAMERA CONTROL</div>
          <h1>Mọi góc quay.<br /><span>Một nhịp bấm.</span></h1>
          <p>Điều phối nhiều camera cùng lúc. Tập trung vào khoảnh khắc, để Multi-Cam lo phần còn lại.</p>
          <div className="showcase-scene">
            <div className="scene-orbit orbit-one" /><div className="scene-orbit orbit-two" />
            <div className="scene-center"><Icon name="camera" size={34} /><span>REC</span></div>
            <div className="scene-node node-a"><Icon name="camera" size={17} /><i /></div>
            <div className="scene-node node-b"><Icon name="camera" size={17} /><i /></div>
            <div className="scene-node node-c"><Icon name="camera" size={17} /><i /></div>
            <div className="scene-caption"><span className="live-dot" /> 3 CAMERA READY</div>
          </div>
        </div>
        <div className="showcase-footer"><span>© 2026 Multi-Cam Recorder</span><span>Đồng bộ. An toàn. Đơn giản.</span></div>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <div className="login-heading">
            <div className="login-mobile-brand"><span className="brand-mark"><Icon name="camera" size={19} /></span><strong>multi<span>cam</span></strong></div>
            <div className="eyebrow">CHÀO MỪNG TRỞ LẠI</div>
            <h2>Đăng nhập</h2>
            <p>Controller vào bảng điều khiển; Remote tham gia phòng bằng mã mời.</p>
          </div>
          <form onSubmit={onSubmit} className="login-form">
            <label htmlFor="email">Email hoặc số điện thoại</label>
            <input id="email" autoComplete="username" value={email} onChange={(event) => onEmailChange(event.target.value)} placeholder="controller@example.com" required />
            <div className="password-label"><label htmlFor="password">Mật khẩu</label><button type="button" className="text-button" onClick={() => setForgotNotice("Luồng quên mật khẩu sẽ được nối với API sau.")}>Quên mật khẩu?</button></div>
            <input id="password" type="password" autoComplete="current-password" value={password} onChange={(event) => onPasswordChange(event.target.value)} placeholder="Nhập mật khẩu" required />
            {forgotNotice && <div className="form-info" role="status">{forgotNotice}</div>}
            {error && <div className="form-error" role="alert">{error}</div>}
            <button className="primary-button login-submit" type="submit" disabled={isLoading}>
              {isLoading ? "Đang đăng nhập..." : "Đăng nhập"} <Icon name="arrow" size={17} />
            </button>
          </form>
          <div className="login-divider"><span /> hoặc <span /></div>
          <button className="secondary-button demo-button" onClick={onDemo}>Khám phá giao diện demo <Icon name="arrow" size={16} /></button>
          <p className="login-footnote"><span className="lock-symbol">◇</span> Phiên làm việc của bạn được bảo vệ an toàn</p>
        </div>
      </section>
    </main>
  );
}

function RemoteJoinScreen({
  accessToken,
  deviceId,
  onLogout,
}: {
  accessToken: string;
  deviceId: string;
  onLogout: () => void;
}) {
  const [inviteCode, setInviteCode] = useState("");
  const [cameraName, setCameraName] = useState("Remote Camera");
  const [grantControl, setGrantControl] = useState(false);
  const [joinedRoom, setJoinedRoom] = useState<JoinRoomResponse | null>(null);
  const [error, setError] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  async function handleJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const normalizedCode = inviteCode.trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(normalizedCode)) {
      setError("Mã phòng phải gồm đúng 6 chữ và số.");
      return;
    }
    if (!grantControl) {
      setError("Bạn cần đồng ý cho Controller điều khiển thiết bị.");
      return;
    }

    setIsJoining(true);
    try {
      const result = await joinRoom(
        accessToken,
        normalizedCode,
        deviceId,
        cameraName.trim(),
      );
      setJoinedRoom(result);
    } catch (joinError) {
      setError(joinError instanceof Error ? joinError.message : "Không thể tham gia phòng.");
    } finally {
      setIsJoining(false);
    }
  }

  return (
    <main className="remote-layout">
      <header className="remote-topbar">
        <div className="login-brand"><span className="brand-mark"><Icon name="camera" size={20} /></span><strong>multi<span>cam</span></strong></div>
        <button className="outline-button" onClick={onLogout}><Icon name="logout" size={16} /> Đăng xuất</button>
      </header>
      <section className="remote-card">
        <div className="remote-icon"><Icon name="camera" size={25} /></div>
        <div className="eyebrow">REMOTE CAMERA</div>
        <h1>{joinedRoom ? "Đã tham gia phòng" : "Kết nối với Controller"}</h1>
        <p className="remote-intro">{joinedRoom ? "Thiết bị đã sẵn sàng nhận lệnh điều khiển từ xa." : "Nhập mã 6 ký tự do Controller cung cấp để tham gia phiên ghi hình."}</p>

        {joinedRoom ? (
          <div className="joined-room">
            <div className="remote-control-banner"><span className="live-dot" /> ĐANG ĐƯỢC ĐIỀU KHIỂN TỪ XA</div>
            <div className="joined-room-details">
              <span>PHÒNG HIỆN TẠI</span>
              <strong>{joinedRoom.room_name}</strong>
              <small>{joinedRoom.members.length} thiết bị trong phòng · {cameraName}</small>
            </div>
            <div className="remote-waiting"><span className="connection-dot" /> Đang chờ Controller bắt đầu ghi hình</div>
          </div>
        ) : (
          <form className="remote-form" onSubmit={handleJoin}>
            <label htmlFor="invite-code">Mã mời phòng</label>
            <input
              id="invite-code"
              className="invite-code-input"
              autoComplete="one-time-code"
              maxLength={6}
              value={inviteCode}
              onChange={(event) => setInviteCode(event.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase())}
              placeholder="VD: 8F2A1C"
              required
            />
            <label htmlFor="camera-name">Tên thiết bị</label>
            <input id="camera-name" value={cameraName} onChange={(event) => setCameraName(event.target.value)} maxLength={64} required />
            <label className="consent-row">
              <input type="checkbox" checked={grantControl} onChange={(event) => setGrantControl(event.target.checked)} />
              <span>Tôi đồng ý cho Controller điều khiển việc bắt đầu và dừng quay trên thiết bị này.</span>
            </label>
            {error && <div className="form-error" role="alert">{error}</div>}
            <button className="primary-button remote-submit" type="submit" disabled={isJoining}>
              {isJoining ? "Đang kết nối..." : "Tham gia phòng"} <Icon name="arrow" size={17} />
            </button>
          </form>
        )}
        <div className="remote-footer"><Icon name="wifi" size={15} /> Thiết bị và Controller cần kết nối tới cùng server.</div>
      </section>
    </main>
  );
}

interface OverviewPageProps {
  inviteCode: string | null;
  cameras: CameraDevice[];
  recordings: Recording[];
  isRecording: boolean;
  isDemo: boolean;
  isCreatingRoom: boolean;
  onCreateRoom: () => void;
  onCopyCode: () => void;
  onToggleRecording: () => void;
  onGoToCameras: () => void;
  onGoToRecordings: () => void;
  onRefreshCameras: () => void;
}

function OverviewPage({
  inviteCode,
  cameras,
  recordings,
  isRecording,
  isDemo,
  isCreatingRoom,
  onCreateRoom,
  onCopyCode,
  onToggleRecording,
  onGoToCameras,
  onGoToRecordings,
  onRefreshCameras,
}: OverviewPageProps) {
  const activeCameras = cameras.filter((camera) => camera.status !== "offline").length;
  const storageMb = recordings.reduce(
    (sum, recording) => sum + Number.parseInt(recording.size, 10),
    0,
  );
  const now = new Date();
  const greeting =
    now.getHours() < 12 ? "Chào buổi sáng" : now.getHours() < 18 ? "Chào buổi chiều" : "Chào buổi tối";
  const dateLabel = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now).toLocaleUpperCase("vi-VN");
  return (
    <>
      <section className="page-heading">
        <div>
          <div className="eyebrow">{dateLabel}</div>
          <h1>{greeting}, Controller <span className="wave">✦</span></h1>
          <p>Sẵn sàng cho buổi ghi hình tiếp theo của bạn?</p>
        </div>
        <button className="primary-button create-room-button" onClick={onCreateRoom} disabled={isCreatingRoom}><Icon name="plus" size={18} /> {isCreatingRoom ? "Đang tạo phòng..." : "Tạo phòng mới"}</button>
      </section>

      <section className="stats-grid">
        <StatCard label="Thiết bị trực tuyến" value={`${activeCameras} / ${cameras.length}`} detail="Trong workspace hiện tại" icon="camera" tone="blue" />
        <StatCard label="Đã ghi hình hôm nay" value={isRecording ? "ĐANG QUAY" : "02"} detail={isRecording ? "Phiên ghi hình đang hoạt động" : "+ 2 video mới"} icon="video" tone="violet" />
        <StatCard label="Tổng video" value={String(recordings.length).padStart(2, "0")} detail={`${recordings.length} video trong thư viện`} icon="clock" tone="mint" />
        <StatCard label="Dung lượng đã dùng" value={`${storageMb} MB`} detail="Trong bộ nhớ máy chủ (demo)" icon="battery" tone="amber" />
      </section>

      <div className="dashboard-grid">
        <section className="panel room-panel">
          <div className="panel-heading">
            <div><div className="section-kicker">ĐIỀU KHIỂN</div><h2>Phòng ghi hình</h2></div>
            <span className={`status-badge ${inviteCode ? "status-badge--active" : "status-badge--idle"}`}><i />{inviteCode ? "Đang mở" : "Chưa có phòng"}</span>
          </div>
          {inviteCode ? (
            <>
              <div className="room-active">
                <div className="room-code-block">
                  <span>MÃ MỜI PHÒNG</span>
                  <div className="room-code">{inviteCode}<button className="icon-button copy-button" title="Sao chép mã" onClick={onCopyCode}><Icon name="copy" size={17} /></button></div>
                  <small>Mã mời dùng để kết nối thiết bị Remote</small>
                </div>
                <div className="room-qr" aria-label={`Mã QR phòng ${inviteCode}`}><QRCodeSVG value={inviteCode} size={66} level="M" /><span>QUÉT ĐỂ THAM GIA</span></div>
              </div>
              <div className="room-meta"><span><Icon name="users" size={16} /> {activeCamerasLabel(cameras)} thiết bị đã kết nối</span><span><Icon name="clock" size={16} /> Hết hạn sau 30 phút</span></div>
              <div className="record-control">
                <div className="record-control-copy"><span className={`record-indicator ${isRecording ? "record-indicator--active" : ""}`} /><div><strong>{isRecording ? "Đang ghi hình" : "Sẵn sàng ghi hình"}</strong><small>{isRecording ? "Lệnh đã gửi tới các camera đang online" : "Bắt đầu đồng bộ tất cả thiết bị"}</small></div></div>
                <button className={`record-button ${isRecording ? "record-button--stop" : ""}`} onClick={onToggleRecording} disabled={!isDemo}><Icon name={isRecording ? "stop" : "play"} size={16} />{isRecording ? "Dừng quay" : "Bắt đầu quay"}</button>
              </div>
            </>
          ) : (
            <div className="empty-room">
              <div className="empty-room-art"><div className="empty-ring"><Icon name="camera" size={25} /></div><span className="empty-spark spark-one">✦</span><span className="empty-spark spark-two">✧</span></div>
              <h3>Chưa có phòng ghi hình</h3>
              <p>Tạo một phòng và chia sẻ mã mời để kết nối các thiết bị Remote Camera.</p>
              <button className="primary-button" onClick={onCreateRoom} disabled={isCreatingRoom}><Icon name="plus" size={17} /> {isCreatingRoom ? "Đang tạo phòng..." : "Tạo phòng đầu tiên"}</button>
            </div>
          )}
        </section>

        <section className="panel devices-panel">
          <div className="panel-heading">
            <div><div className="section-kicker">REMOTE CAMERA</div><h2>Thiết bị</h2></div>
            <button className="link-button" onClick={onGoToCameras}>Xem tất cả <Icon name="arrow" size={15} /></button>
          </div>
          <div className="device-list">
            {cameras.slice(0, 3).map((camera) => <DeviceRow key={camera.id} camera={camera} compact />)}
          </div>
          <div className="devices-footer"><span><i className="connection-dot" /> {activeCameras} thiết bị sẵn sàng</span><button className="icon-button refresh-button" aria-label="Làm mới danh sách thiết bị" title="Tải lại thành viên phòng" onClick={onRefreshCameras}><Icon name="refresh" size={17} /></button></div>
        </section>
      </div>

      <section className="panel recordings-panel">
        <div className="panel-heading">
          <div><div className="section-kicker">LƯU TRỮ</div><h2>Video gần đây</h2></div>
          <button className="link-button" onClick={onGoToRecordings}>Mở thư viện <Icon name="arrow" size={15} /></button>
        </div>
        <RecordingsTable recordings={recordings.slice(0, 3)} onDelete={() => undefined} compact />
      </section>
      <DemoNotice isDemo={isDemo} />
    </>
  );
}

function activeCamerasLabel(cameras: CameraDevice[]) {
  return cameras.filter((camera) => camera.status !== "offline").length;
}

function StatCard({ label, value, detail, icon, tone }: { label: string; value: string; detail: string; icon: IconName; tone: string }) {
  return (
    <article className="stat-card">
      <div className={`stat-icon stat-icon--${tone}`}><Icon name={icon} size={19} /></div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-detail">{detail}</div>
      <div className={`stat-decoration stat-decoration--${tone}`} />
    </article>
  );
}

function DeviceRow({ camera, compact = false }: { camera: CameraDevice; compact?: boolean }) {
  const statusText = camera.status === "offline" ? "Offline" : camera.status === "recording" ? "Đang quay" : "Trực tuyến";
  return (
    <div className={`device-row ${compact ? "device-row--compact" : ""}`}>
      <div className={`device-thumb ${camera.status === "offline" ? "device-thumb--offline" : ""}`}><Icon name="camera" size={21} /><span className={`device-live ${camera.status === "offline" ? "device-live--off" : camera.status === "recording" ? "device-live--recording" : ""}`} /></div>
      <div className="device-details"><strong>{camera.name}</strong><span>{camera.model}</span></div>
      <div className={`device-status ${camera.status === "offline" ? "device-status--offline" : camera.status === "recording" ? "device-status--recording" : ""}`}><i />{statusText}</div>
      {!compact && <div className="device-meta"><span><Icon name="battery" size={15} />{camera.battery}%</span><span>Camera {camera.camera}</span><span>{camera.lastSeen}</span></div>}
      {compact && <span className="device-battery"><Icon name="battery" size={15} />{camera.battery}%</span>}
      <button className="icon-button more-button" aria-label={`Tùy chọn ${camera.name}`}><Icon name="more" size={19} /></button>
    </div>
  );
}

function CamerasPage({ cameras, isDemo, onFlip }: { cameras: CameraDevice[]; isDemo: boolean; onFlip: (id: string) => void }) {
  const [search, setSearch] = useState("");
  const filtered = cameras.filter((camera) => `${camera.name} ${camera.model}`.toLowerCase().includes(search.toLowerCase()));
  return (
    <>
      <section className="page-heading page-heading--sub">
        <div><div className="eyebrow">WORKSPACE / THIẾT BỊ</div><h1>Thiết bị camera</h1><p>Quản lý các thiết bị Remote đang tham gia hệ thống.</p></div>
        <div className="heading-actions"><span className="connection-pill"><span className="connection-dot" />{cameras.filter((camera) => camera.status !== "offline").length} thiết bị online</span></div>
      </section>
      <section className="panel page-panel">
        <div className="panel-toolbar">
          <div><h2>Danh sách thiết bị <span className="table-count">{cameras.length}</span></h2><p>Trạng thái cập nhật theo kết nối gần nhất.</p></div>
          <div className="search-box"><Icon name="search" size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm thiết bị..." /></div>
        </div>
        {filtered.length ? <div className="device-table">{filtered.map((camera) => <div className="device-row-full" key={camera.id}><DeviceRow camera={camera} /><button className="outline-button flip-button" disabled={camera.status === "offline"} onClick={() => onFlip(camera.id)}>Đổi camera <Icon name="refresh" size={15} /></button></div>)}</div> : <EmptyState title="Không tìm thấy thiết bị" description="Thử đổi từ khóa tìm kiếm." />}
      </section>
      <DemoNotice isDemo={isDemo} />
    </>
  );
}

function RecordingsPage({ recordings, isDemo, onDelete }: { recordings: Recording[]; isDemo: boolean; onDelete: (id: string) => void }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const filtered = recordings.filter((recording) => `${recording.title} ${recording.cameraName}`.toLowerCase().includes(search.toLowerCase()));
  function toggleSelected(id: string) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }
  return (
    <>
      <section className="page-heading page-heading--sub">
        <div><div className="eyebrow">WORKSPACE / LƯU TRỮ</div><h1>Thư viện video</h1><p>Video từ các thiết bị Remote được tải lên máy chủ.</p></div>
        <div className="heading-actions"><span className="storage-chip"><Icon name="video" size={16} /> {recordings.length} video · 1.8 GB</span></div>
      </section>
      <section className="panel page-panel">
        <div className="panel-toolbar">
          <div><h2>Tất cả video <span className="table-count">{recordings.length}</span></h2><p>Chọn một hoặc nhiều video để quản lý.</p></div>
          <div className="toolbar-actions">
            <div className="search-box"><Icon name="search" size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm video..." /></div>
            <button className="outline-button" disabled={!selected.length} onClick={() => { selected.forEach(onDelete); setSelected([]); }}> <Icon name="trash" size={16} /> Xóa đã chọn {selected.length ? `(${selected.length})` : ""}</button>
          </div>
        </div>
        {filtered.length ? <RecordingsTable recordings={filtered} onDelete={onDelete} selected={selected} onToggle={toggleSelected} /> : <EmptyState title="Chưa có video phù hợp" description="Video mới sẽ xuất hiện ở đây sau khi được tải lên." />}
      </section>
      <DemoNotice isDemo={isDemo} />
    </>
  );
}

function RecordingsTable({
  recordings,
  onDelete,
  compact = false,
  selected = [],
  onToggle,
}: {
  recordings: Recording[];
  onDelete: (id: string) => void;
  compact?: boolean;
  selected?: string[];
  onToggle?: (id: string) => void;
}) {
  return (
    <div className={`recordings-table-wrap ${compact ? "recordings-table-wrap--compact" : ""}`}>
      <table className="recordings-table">
        <thead><tr>{!compact && <th className="select-col" /> }<th>Tên video</th><th>Ngày ghi</th><th>Thời lượng</th><th>Kích thước</th><th>Trạng thái</th><th /></tr></thead>
        <tbody>
          {recordings.map((recording) => (
            <tr key={recording.id}>
              {!compact && <td><input className="table-checkbox" type="checkbox" checked={selected.includes(recording.id)} onChange={() => onToggle?.(recording.id)} aria-label={`Chọn ${recording.title}`} /></td>}
              <td><div className="video-name"><div className="video-preview"><Icon name="play" size={13} /></div><div><strong>{recording.title}</strong><span>{recording.cameraName}</span></div></div></td>
              <td className="table-muted">{recording.date}</td>
              <td className="table-muted">{recording.duration}</td>
              <td className="table-muted">{recording.size}</td>
              <td><span className="upload-status"><i />{recording.status}</span></td>
              <td>{!compact && <div className="row-actions"><button className="icon-button" title="Tải video (cần kết nối API)" disabled><Icon name="download" size={17} /></button><button className="icon-button" title="Xóa video" onClick={() => onDelete(recording.id)}><Icon name="trash" size={16} /></button></div>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SettingsPage({ isDemo, onLogout, onNotify }: { isDemo: boolean; onLogout: () => void; onNotify: (message: string) => void }) {
  return (
    <>
      <section className="page-heading page-heading--sub"><div><div className="eyebrow">WORKSPACE / TÙY CHỈNH</div><h1>Cài đặt</h1><p>Cấu hình workspace Controller và phiên làm việc.</p></div></section>
      <section className="panel settings-panel">
        <div className="settings-section"><div><h2>Workspace</h2><p>Thông tin cơ bản của bảng điều khiển.</p></div><div className="settings-fields"><label>Tên workspace<input value="Studio của bạn" readOnly /></label><label>Vai trò tài khoản<input value="Controller" readOnly /></label></div></div>
        <div className="settings-section"><div><h2>Kết nối</h2><p>Backend REST API và đồng bộ thiết bị.</p></div><div className="settings-connection"><span className={`connection-dot ${isDemo ? "connection-dot--demo" : ""}`} /><div><strong>{isDemo ? "Chế độ demo đang bật" : "Đã đăng nhập; API dashboard chưa tích hợp"}</strong><small>{isDemo ? "Dữ liệu hiển thị là dữ liệu mẫu trong trình duyệt." : "Các API phòng, thiết bị và video sẽ được nối ở bước tiếp theo."}</small></div><button className="outline-button" onClick={() => onNotify("Kiểm tra kết nối API sẽ được thêm sau.")}>Kiểm tra kết nối</button></div></div>
        <div className="settings-section settings-danger"><div><h2>Phiên làm việc</h2><p>Thoát khỏi bảng điều khiển trên thiết bị này.</p></div><button className="outline-button danger-button" onClick={onLogout}><Icon name="logout" size={16} /> Đăng xuất</button></div>
      </section>
      <DemoNotice isDemo={isDemo} />
    </>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="empty-state"><div className="empty-state-icon"><Icon name="search" size={22} /></div><strong>{title}</strong><p>{description}</p></div>;
}

function DemoNotice({ isDemo }: { isDemo: boolean }) {
  return <div className="demo-notice"><span>i</span><p><strong>{isDemo ? "Chế độ demo đang bật." : "Backend tuần 1 đã kết nối."}</strong> {isDemo ? "Dữ liệu phòng, camera và video là dữ liệu mẫu; thao tác chỉ cập nhật giao diện." : "Đăng nhập, tạo phòng và tham gia phòng dùng API thật. Điều khiển quay, tải lên và quản lý video sẽ được tích hợp ở các tuần tiếp theo."}</p></div>;
}

export default App;
