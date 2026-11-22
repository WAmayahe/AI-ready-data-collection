# AI-ready-data-collection

BÀI TẬP LỚN IV : THU THẬP DỮ LIỆU TẬP CHUẨN ΑΙ

Du an thu thap video voi mot giao dien Controller tren web va cac dien thoai Android lam Remote Camera.

## Cong nghe du kien

- `web/`: React, TypeScript, Vite.
- `server/`: Java, Spring Boot, REST API, WebSocket va JPA.
- `android/`: Kotlin, Jetpack Compose va CameraX.
- Database hien tai: H2 file-based de chay local; co the chuyen sang PostgreSQL khi deploy.

## Cau truc

```text
docs/
  api/                 Tai lieu hop dong API
  architecture/        So do va quyet dinh kien truc
  report/              Bao cao va tai lieu nop
web/
  public/
  src/
    app/               Khoi tao ung dung va routing
    assets/
    components/        Component dung chung
    features/          auth, rooms, recording, videos
    lib/               Tien ich va cau hinh thu vien
    services/          REST va WebSocket clients
    types/             Kieu du lieu TypeScript
server/
  src/main/java/com/it4409/multicam/
    config/
    controller/
    dto/
    entity/
    exception/
    repository/
    security/
    service/
    websocket/
  src/main/resources/db/migration/
  src/test/
android/
  app/src/main/java/com/it4409/multicam/
    data/
    domain/
    service/
    ui/
    util/
  app/src/main/res/
  app/src/test/
  app/src/androidTest/
```

## Luong MVP

1. Controller tao phong va nhan ma moi.
2. Remote tham gia phong bang ma.
3. Controller xem thanh vien dang ket noi.
4. Controller gui lenh bat dau/dung quay qua WebSocket.
5. Remote quay video va upload len server.
6. Controller xem thu vien video.

## Chay backend

Can co JDK 21 tro len. Maven Wrapper se tu tai Maven neu may chua cai Maven.

```powershell
cd server
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
$env:APP_JWT_SECRET = [Convert]::ToBase64String($bytes)
$env:APP_BOOTSTRAP_CONTROLLER_PASSWORD = "<mat-khau-controller>"
$env:APP_BOOTSTRAP_REMOTE_PASSWORD = "<mat-khau-remote>"
.\mvnw.cmd spring-boot:run
```

Lan chay dau tien, backend tao tai khoan Controller (`controller@local.test`) va Remote (`remote@local.test`) tu cac mat khau trong bien moi truong. Mat khau da hash bang BCrypt; khong co tai khoan hay secret nao duoc commit. Database duoc luu tai `server/data/multicam`.

## Chay frontend

```powershell
cd web
npm install
npm run dev
```

Vite chuyen tiep cac request `/auth`, `/rooms`, `/devices` va `/videos` den backend tai `http://localhost:8080`.

- Dang nhap Controller vao dashboard va tao phong qua `POST /rooms`.
- Dang nhap Remote vao man nhap ma phong; tham gia qua `POST /rooms/join`, co checkbox chap thuan quyen dieu khien.
- Dung tren Android, Remote goi cung API bang access token va `device_type: 1`; web test client dang gui `device_type: 4`.

## Kiem thu

```powershell
cd server
.\mvnw.cmd test
```

Frontend co nut **Kham pha giao dien demo**. Trong che do demo, phong/camera/video la du lieu mau. Khi dang nhap that, login, tao phong va tham gia phong dung backend; dieu khien ghi hinh, upload va thu vien video se duoc noi tiep o cac tuan sau.
