# FOOTBALL EC COMPANY — MASTER IMPLEMENTATION PLAN v2.0

> **Mục đích:** Tài liệu bàn giao cho AI coding agent triển khai trọn vẹn website nội bộ chia đội bóng sân 7. **Ưu tiên tuyệt đối: chi phí vận hành 0đ trong giới hạn gói miễn phí, UI/UX đẹp, mobile-first, đơn giản, bảo mật và dễ bảo trì.**
>
> **Tên sản phẩm:** Football EC Company
> **GitHub repository:** `football-ec-company`
> **GitHub description:** `A free, smart 7-a-side football team randomizer with balanced player distribution and an interactive spinning wheel.`
> **Ngôn ngữ giao diện:** Tiếng Việt.
> **Trạng thái:** Chưa có danh sách cầu thủ thực tế; dùng dữ liệu mẫu và cơ chế import để bổ sung sau.

---

## 0. Quyết định kiến trúc (KHÔNG TỰ Ý ĐỔI)

- **Frontend:** React + TypeScript + Vite, React Router, Tailwind CSS, Lucide icons.
- **Database + authentication + authorization:** **Supabase (PostgreSQL)** gói miễn phí; sử dụng `@supabase/supabase-js` trực tiếp từ frontend, **không xây backend riêng**.
- **Hosting:** GitHub Pages miễn phí cho repo public; dùng GitHub Actions deploy tự động.
- **Lưu tạm giao diện:** React state / localStorage cho draft đang chia, không dùng làm nguồn dữ liệu chính.
- **Thuật toán cân bằng và animation:** TypeScript thuần phía client; **chỉ admin mới có quyền lưu kết quả** qua chính sách RLS.
- **Xuất ảnh:** `html-to-image` hoặc giải pháp tương đương, chỉ thực hiện client-side.
- **Không dùng:** MySQL, Rails API, server tự quản, dịch vụ trả phí, API key bí mật nhúng vào frontend, hệ thống đăng ký người dùng công khai.

### 0.1 Vì sao không chọn MySQL?

GitHub Pages chỉ host file tĩnh, không chạy MySQL hay Rails. Kết nối trực tiếp MySQL từ trình duyệt không an toàn. Supabase cung cấp database, API, đăng nhập và RLS trong một dịch vụ, giúp AI agent xây toàn bộ code mà không cần vận hành server. PostgreSQL là lựa chọn kỹ thuật phù hợp hơn MySQL **cho ràng buộc không backend và 0đ**.

### 0.2 Giới hạn thực tế của cam kết miễn phí và quyền truy cập agent

- Mục tiêu là **0đ/tháng khi còn trong quota miễn phí**; nhà cung cấp có thể thay đổi quota, tạm dừng dự án không hoạt động hoặc thay đổi điều khoản. Không hứa miễn phí vĩnh viễn.
- Agent có thể **viết 100% mã nguồn, SQL migrations, tests, cấu hình CI/CD, tài liệu và hướng dẫn triển khai**. Để tạo dự án Supabase, GitHub repo, bật Pages hoặc cấu hình secrets trên tài khoản thật, **chủ tài khoản phải đăng nhập/cấp quyền hoặc thực hiện bước xác nhận cần thiết**. Không bao giờ yêu cầu agent tự đoán mật khẩu hoặc vượt xác thực.
- Không commit `.env`, mật khẩu, token, Supabase service-role/secret key. `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY` (publishable/anon key) có thể nằm trong frontend **chỉ khi RLS được bật và kiểm thử**.
- Supabase free project có thể bị pause; cung cấp hướng dẫn restore/backup. GitHub Pages public repo có mã nguồn công khai; dữ liệu thành viên cũng được người xem website truy cập, nên chỉ lưu tên/biệt danh và thông tin bóng đá được phép công khai, không lưu số điện thoại/ngày sinh.

---

## 1. Phạm vi sản phẩm

### 1.1 MVP bắt buộc

1. Xem danh sách cầu thủ (công khai, không đăng nhập).
2. Admin duy nhất đăng nhập email/password, thêm/sửa/xóa hoặc vô hiệu hóa cầu thủ.
3. Cầu thủ có tên, biệt danh tùy chọn, hạt giống **1 = mạnh**, **2 = yếu**, vị trí chính và tối đa 2 vị trí phụ.
4. Vị trí sân 7: GK, CB, LB, RB, CM, CAM, LM, RM, ST; nhóm chiến thuật: GK / DEF / MID / ATT.
5. Admin điểm danh cho buổi đá, chọn 2 hoặc 3 đội.
6. Chia đội **ngẫu nhiên có ràng buộc cân bằng** theo số lượng, hạt giống, nhóm vị trí, đặc biệt thủ môn.
7. **Cách B:** bấm một lần để tự động quay hết danh sách, lần lượt reveal từng người; có **Tạm dừng / Tiếp tục / Bỏ qua hoạt ảnh**.
8. Hiển thị kết quả đội A/B hoặc A/B/C, số lượng, hạt giống, vị trí, sân 7 và người dư (dự bị/luân phiên).
9. Admin xác nhận và lưu kết quả; viewer chỉ đọc kết quả đã công bố.
10. Xuất ảnh PNG chia sẻ Zalo; responsive desktop/mobile; loading/empty/error states.
11. Lưu lịch sử các lần chia đội; mở xem chi tiết.

### 1.2 Không làm trong MVP

Sân 9/11, thống kê bàn thắng, lịch thi đấu, chat, realtime streaming vòng quay, thanh toán, push notification, đăng ký tài khoản công khai, bảng xếp hạng cầu thủ. Thiết kế dữ liệu đủ mở rộng nhưng **không over-engineer**.

---

## 2. Quyền hạn và bảo mật

| Chức năng                      | Viewer (không đăng nhập) | Admin (1 tài khoản) |
| ------------------------------ | ------------------------ | ------------------- |
| Xem cầu thủ, hạt giống, vị trí | Có                       | Có                  |
| Xem lịch sử và kết quả công bố | Có                       | Có                  |
| Tải ảnh kết quả                | Có                       | Có                  |
| Thêm/sửa/xóa cầu thủ           | Không                    | Có                  |
| Điểm danh, quay, chỉnh kết quả | Không                    | Có                  |
| Lưu/công bố/xóa phiên chia đội | Không                    | Có                  |
| Tạo thêm admin                 | Không                    | Không qua UI        |

**Bắt buộc:**

- Tạo đúng **một tài khoản admin** bằng Supabase Auth dashboard hoặc công cụ quản trị an toàn của chủ tài khoản. Tắt public signup nếu phù hợp.
- Lưu `auth.uid()` admin trong bảng `app_admins`; chỉ chủ dự án có quyền thêm bằng thao tác quản trị an toàn, **không cấp INSERT/UPDATE/DELETE bảng này cho anon/authenticated**.
- RLS cho **mọi** bảng `public`; SELECT công khai chỉ cho dữ liệu được chủ dự án đồng ý công khai; INSERT/UPDATE/DELETE chỉ cho `auth.uid()` có trong `app_admins`.
- Không dùng kiểm tra `isAdmin` trên React làm lớp bảo vệ duy nhất; mọi mutation phải được RLS bảo vệ.
- Chỉ cho viewer đọc phiên `published`; admin có thể đọc `draft`.
- Không cung cấp nút đăng ký; trang `/admin/login` chỉ dùng cho tài khoản admin đã được cấp.
- Khi logout, xóa auth session theo SDK và điều hướng hợp lý; không hardcode credential.

---

## 3. Database schema (Supabase PostgreSQL)

Tạo migrations SQL version-controlled trong `supabase/migrations/`. Các bảng tối thiểu:

### 3.1 `app_admins`

- `user_id uuid primary key references auth.users(id) on delete cascade`
- `created_at timestamptz not null default now()`
- Không cho client thêm/xóa admin. RLS không có write policy cho client. Kiểm tra admin bằng helper SQL `public.is_admin()` kiểu `stable security definer`, `set search_path = ''`, tham chiếu bảng bằng schema-qualified names; hạn chế EXECUTE đúng roles cần thiết, kiểm tra migration linter.

### 3.2 `players`

- `id uuid primary key default gen_random_uuid()`
- `name text not null` (trim, độ dài 1–80)
- `nickname text null` (tối đa 50)
- `seed smallint not null check (seed in (1,2))`
- `primary_position text not null check (...)`
- `secondary_positions text[] not null default '{}'` (0–2 phần tử, unique, không trùng vị trí chính; enforce bằng check/function hoặc validation trigger)
- `is_active boolean not null default true`
- `created_at`, `updated_at timestamptz`
- Dùng `id` UUID, không dùng tên làm khóa.

### 3.3 `draw_sessions`

- `id uuid primary key default gen_random_uuid()`
- `title text not null` (ví dụ `Đá bóng 12/11/2026`)
- `match_date date not null`
- `team_count smallint not null check (team_count in (2,3))`
- `field_size smallint not null default 7 check (field_size = 7)` (MVP)
- `status text not null check (status in ('draft','published'))`
- `created_by uuid references auth.users(id)`
- `algorithm_version text not null`
- `draw_seed text not null` (để có thể tái hiện kết quả với thuật toán deterministic nếu cần)
- `created_at`, `published_at timestamptz`

### 3.4 `draw_assignments`

- `id uuid primary key default gen_random_uuid()`
- `session_id uuid not null references draw_sessions(id) on delete cascade`
- `player_id uuid not null references players(id)` (ưu tiên RESTRICT xóa cầu thủ có lịch sử; UI cho phép inactive)
- `team_index smallint not null check (team_index between 0 and 2)`
- `is_starting boolean not null default false`
- `reveal_order integer not null`
- `player_name_snapshot text not null`
- `seed_snapshot smallint not null`
- `position_snapshot text not null`
- `unique(session_id, player_id)`
- `unique(session_id, reveal_order)`

**Lưu ý:** snapshot giúp lịch sử không đổi khi sửa thông tin cầu thủ. Không tạo bảng attendance riêng trong MVP: danh sách người có mặt là danh sách assignments của phiên đã lưu; danh sách đang chọn giữ trong state/localStorage draft. Nếu cần lưu draft trước khi quay, mở rộng sau.

### 3.5 Indexes, constraints, triggers

- Index `draw_sessions(status, match_date desc)`, `draw_assignments(session_id, team_index)`.
- Trigger `updated_at` cho players; validation vị trí phụ.
- RLS policies SELECT/INSERT/UPDATE/DELETE tương ứng; viết file `supabase/README.md` hướng dẫn chạy migrations, tạo admin, rollback.
- **Atomic publish:** thao tác lưu session + assignments phải nguyên tử, tránh session được công bố khi mới lưu một phần. Tạo RPC `publish_draw(...)` chạy trong một transaction, `security invoker` hoặc `security definer` với kiểm tra admin nghiêm ngặt, validate toàn bộ dữ liệu (team count, UUID duy nhất, index hợp lệ, số lượng); không cấp quyền gọi cho anon. Không dùng nhiều lệnh insert riêng rẽ rồi giả định luôn thành công.
- Nếu sử dụng RPC `security definer`, phải kiểm tra `auth.uid()` thuộc `app_admins` ngay trong hàm, cố định `search_path`, chỉ GRANT EXECUTE cho authenticated và kiểm thử anon bị từ chối.
- **Không cho client sửa session đã published**; nếu muốn chia lại, tạo phiên mới. RLS/DB validation cần ngăn thay đổi lịch sử đã công bố, không chỉ chặn ở UI.

---

## 4. Thuật toán chia đội — yêu cầu chính xác

### 4.1 Nguyên tắc

- Chỉ xử lý cầu thủ admin tick có mặt.
- Mỗi cầu thủ vào **đúng một đội**.
- Số lượng đội chênh nhau **tối đa 1**.
- Cố gắng cân bằng số cầu thủ seed 1 giữa các đội; chênh lệch tối đa 1 **khi khả thi**.
- Cân bằng GK trước, sau đó DEF/MID/ATT; dùng vị trí phụ để giảm lệch.
- Không khẳng định cân bằng tuyệt đối khi phân bố đầu vào bất khả thi (ví dụ chỉ có 1 GK cho 3 đội). UI hiển thị cảnh báo và cho phép cầu thủ khác bắt thay nếu admin đồng ý.
- **Random thật trong tập phương án có chất lượng tương đương**; không luôn cho cầu thủ mạnh nhất về A.
- Nếu người lẻ, ưu tiên đội thiếu số lượng/thiếu seed/thiếu vị trí; random khi ngang nhau.
- Có thể chia 24 người cho 2 đội (12–12) hoặc 3 đội (8–8–8); sân 7 thì người ngoài 7 là dự bị luân phiên.

### 4.2 Cách thực hiện khuyến nghị

1. Chuẩn hóa đầu vào, validate số người tối thiểu (MVP cho phép thử với ít người nhưng cảnh báo nếu < 7/đội).
2. Xác định capacity từng đội (`floor(N/K)` + phân bổ remainder ngẫu nhiên, cân bằng).
3. Nhóm cầu thủ theo `seed`, `primary_position` và nhóm vị trí; shuffle seeded deterministic bằng PRNG từ `draw_seed`.
4. Tạo nhiều candidate assignments (ví dụ 300–1000 lần với N <= 24), mỗi candidate luôn thỏa số lượng, unique players.
5. Chấm điểm penalty theo thứ tự ưu tiên: thiếu GK, chênh seed 1, chênh DEF/MID/ATT, số cầu thủ không khớp vị trí; có trọng số rõ ràng trong `balanceTeams.ts`.
6. Chọn ngẫu nhiên trong nhóm candidate có penalty thấp nhất; lưu `algorithm_version`, `draw_seed`.
7. Trả về `assignments`, `qualityMetrics`, `warnings`, `revealSequence`.
8. Tách **kết quả phân đội** khỏi **hoạt ảnh vòng quay**: pause/resume/skip chỉ ảnh hưởng hiển thị, không đổi kết quả.
9. Phân bổ starting 7 (nếu >7) cân bằng theo vị trí; mặc định cho admin điều chỉnh thủ công. Nếu <7 hiển thị đội hình thiếu người, không tạo cầu thủ ảo.

### 4.3 Test cases bắt buộc

- 14 người / 2 đội = 7–7; 21 / 3 = 7–7–7; 24 / 2 = 12–12; 24 / 3 = 8–8–8.
- 15 / 2 = 8–7; 22 / 3 = 8–7–7.
- Chỉ 1 GK cho 2/3 đội; 2 GK cho 3 đội; nhiều GK.
- Toàn bộ seed 1; toàn bộ seed 2; 1 seed 1 và 20 seed 2.
- Tất cả ST, không có hậu vệ; vị trí phụ linh hoạt.
- Trùng tên nhưng khác UUID; người vắng mặt không được chia; không ai bị chia hai lần.
- Với cùng input + seed, kết quả giống nhau; với seed khác, kết quả có khả năng thay đổi.
- 1000 lượt test ngẫu nhiên: không mất người, không trùng người, capacity hợp lệ, penalty hợp lý.

---

## 5. UI/UX — ưu tiên cao ngang với thuật toán

### 5.1 Visual direction

- Phong cách: **premium sports dashboard**, dark mode chủ đạo, sạch, không quá nhiều hiệu ứng.
- Bảng màu gợi ý: background `#0B1220`, surface `#111C2E`, primary green `#22C55E`, text `#F8FAFC`, muted `#94A3B8`, đội A xanh lá, B xanh dương, C cam; đảm bảo contrast WCAG AA.
- Font: Inter hoặc system sans; tiêu đề mạnh, nội dung dễ đọc, số liệu rõ.
- Card bo góc 12–16px, spacing nhất quán 8px grid, shadows nhẹ, border tinh tế.
- Micro-interactions 150–250ms; vòng quay có animation riêng, hỗ trợ `prefers-reduced-motion`.
- Không dùng hình nền sân bóng gây khó đọc; sân 7 là minh họa chiến thuật rõ ràng.

### 5.2 Mobile-first

- Thiết kế ưu tiên màn hình 360–430px; kiểm tra 320px, tablet, desktop 1440px.
- Thanh điều hướng mobile dễ thao tác; CTA lớn, vùng chạm tối thiểu ~44px.
- Vòng quay không tràn màn hình; dưới là đội A/B/C cập nhật theo từng lượt reveal.
- Không bắt người dùng kéo ngang để xem bảng quan trọng; dùng cards/accordion trên mobile.
- Dialog thêm/sửa cầu thủ có labels, validation rõ, focus management, ESC/close, không mất dữ liệu vô ý.
- Loading skeleton, empty states, toast thành công/lỗi, confirm destructive actions, offline/error banner.
- Không yêu cầu viewer đăng nhập. Admin login kín đáo, không làm rối giao diện chính.

### 5.3 Sitemap / Routes

- `/` — Trang chủ: logo Football EC Company, kết quả gần nhất, CTA xem đội hình, số cầu thủ.
- `/players` — Danh sách cầu thủ, tìm kiếm/lọc hạt giống/vị trí; admin có CRUD.
- `/draw` — Viewer: thông báo chỉ admin được chia; admin: điểm danh + chọn 2/3 đội + quay tự động.
- `/results` — Lịch sử các phiên published.
- `/results/:id` — Chi tiết đội hình, biểu đồ sân 7, xuất ảnh.
- `/admin/login` — Login admin; không có signup.
- `*` — Trang 404 có link về home.

**GitHub Pages:** Dùng `HashRouter` để tránh lỗi refresh/deep link (URL `/#/results/...`) hoặc triển khai fallback 404 phù hợp; ưu tiên HashRouter cho MVP vì dễ và ổn định. Vite `base: '/football-ec-company/'`.

### 5.4 Màn hình quản lý cầu thủ

- Header: `Thành viên` + tổng số + nút `Thêm cầu thủ` (admin).
- Tìm kiếm theo tên/biệt danh; filter seed 1/2, GK/DEF/MID/ATT, active.
- Card có avatar chữ cái, tên, hạt giống dạng badge, vị trí chính và phụ.
- Form validate: tên bắt buộc, seed bắt buộc, vị trí chính bắt buộc, tối đa 2 vị trí phụ khác nhau.
- Xóa nên mặc định `is_active=false` để bảo toàn lịch sử; xóa vĩnh viễn chỉ khi chưa có assignment, có confirm.

### 5.5 Màn hình chia đội — hành trình chính

1. **Điểm danh:** tick người tham gia; có chọn tất cả/bỏ chọn, đếm tổng và thống kê seed/GK.
2. **Cấu hình:** segmented 2 đội / 3 đội; mặc định sân 7, số người/đội dự kiến, cảnh báo thiếu GK.
3. **Xem trước cân bằng:** tổng seed 1/2 và nhóm vị trí, giải thích cách chia.
4. **Bắt đầu quay:** một nút CTA; khóa chỉnh điểm danh trong lúc quay.
5. **Auto-spin:** vòng quay lớn ở trung tâm; từng người được reveal, tên + seed + vị trí + đội nhận; danh sách đội cập nhật dần.
6. **Điều khiển:** `Tạm dừng`, `Tiếp tục`, `Bỏ qua hoạt ảnh`; tốc độ mặc định ~1–2 giây/người, tùy chỉnh nhanh/chậm nếu dễ làm.
7. **Kết thúc:** màn hình tổng kết, cảnh báo thiếu vị trí, `Quay lại từ đầu`, `Lưu & công bố` (admin).
8. **Sau công bố:** viewer thấy phiên mới nhất; không thể sửa lịch sử công bố. Muốn kết quả khác, tạo phiên mới.

**Quan trọng:** Không hiển thị người thắng giả hoặc thay đổi đội sau khi đã reveal; kết quả đã tính trước, vòng quay chỉ diễn hoạt hợp lệ. Nếu reload giữa chừng, cho phép bắt đầu lại phiên chưa lưu, không tạo session published nửa chừng.

### 5.6 Màn hình kết quả

- Tabs đội A/B/C, mỗi đội có số người, số seed 1/2, GK/DEF/MID/ATT.
- Danh sách người rõ ràng và sân 7 với đội hình mặc định (có thể thay đổi lineup bằng thao tác admin trước khi công bố).
- Phần dự bị/luân phiên hiển thị riêng nếu >7.
- Nút `Tải ảnh PNG` gồm tên buổi, ngày, các đội, thành viên, legend seed.
- Share link tới `/results/:id`; nếu share API không hỗ trợ thì copy link.

---

## 6. Thiết kế source code

```text
football-ec-company/
├── .github/workflows/deploy.yml
├── public/
├── src/
│   ├── app/                 # router, providers
│   ├── components/ui/       # Button, Badge, Modal, Toast, Skeleton
│   ├── components/football/ # PlayerCard, SpinWheel, TeamPanel, Pitch7
│   ├── pages/               # Home, Players, Draw, Results, Login
│   ├── features/players/    # CRUD, filters, validation
│   ├── features/draw/       # attendance, animation state machine
│   ├── features/results/    # publish, history, export image
│   ├── algorithms/          # balanceTeams.ts, scoreBalance.ts, seededRandom.ts
│   ├── lib/                 # supabaseClient.ts, auth.ts
│   ├── hooks/               # useAdmin, usePlayers, useSessions
│   ├── types/               # player, session, assignment
│   ├── styles/
│   └── main.tsx
├── supabase/
│   ├── migrations/
│   └── README.md
├── tests/
├── .env.example
├── README.md
├── package.json
└── vite.config.ts
```

- TypeScript strict; ESLint + Prettier; React Testing Library + Vitest; Playwright smoke tests nếu agent có browser.
- Tách repository/service API khỏi component UI; tránh business logic trong JSX.
- Không đưa Supabase credentials thật vào test snapshot/log.
- Cấu hình `.env.example` chỉ có placeholder:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
```

---

## 7. Roadmap thực thi cho AI agent (theo phase)

### Phase 0 — Audit & bootstrap

- [ ] Đọc toàn bộ file này; xác nhận constraints và kiến trúc.
- [ ] Khởi tạo Vite React TypeScript, Tailwind, Router, lint/format/test.
- [ ] Tạo README, `.gitignore`, `.env.example`, GitHub repo name đúng.
- [ ] Cấu hình base path và GitHub Pages deploy workflow.
- [ ] Chạy `npm install`, `npm run build`, `npm run lint`, `npm test`.

**Done khi:** build pass, trang skeleton chạy local, không có secret commit.

### Phase 1 — Design system & responsive shell

- [ ] Theme, typography, spacing, icons, UI primitives.
- [ ] Header/nav mobile/desktop, 404, loading/empty/error.
- [ ] Thiết kế Home, Players, Draw, Results mock với dữ liệu giả.
- [ ] Kiểm tra responsive 320/375/768/1440px, keyboard focus, contrast.

**Done khi:** giao diện đẹp và dùng được trên điện thoại trước khi nối database.

### Phase 2 — Supabase schema & security

- [ ] Viết migration tạo bảng, indexes, triggers, RLS, RPC publish nguyên tử.
- [ ] Viết SQL tests / hướng dẫn manual verification anon vs admin.
- [ ] Tạo project Supabase free **sau khi chủ tài khoản đăng nhập/cấp quyền**.
- [ ] Tạo đúng 1 Auth admin; insert `app_admins` qua SQL editor an toàn.
- [ ] Disable public signup; kiểm thử anon không ghi được, admin ghi được.
- [ ] Không commit service-role key, admin password, DB password.

**Done khi:** permission test pass, không thể ghi dữ liệu từ browser viewer.

### Phase 3 — Player management & attendance

- [ ] Supabase client + hooks query/mutation.
- [ ] Public list, search, filters; admin CRUD/soft-delete.
- [ ] Login/logout, admin route guard (UX), RLS (bảo mật thật).
- [ ] Chọn người có mặt, local draft, clear selection.
- [ ] Form validation + optimistic/error feedback hợp lý.

**Done khi:** viewer chỉ đọc, admin chỉnh sửa, refresh vẫn giữ dữ liệu server.

### Phase 4 — Balanced team algorithm

- [ ] TypeScript pure functions, deterministic PRNG.
- [ ] Candidate generation, scoring, warnings, seed/position balance.
- [ ] Unit tests các trường hợp ở §4.3 và property tests.
- [ ] UI preview chất lượng phân đội, đội dư người, thiếu GK.

**Done khi:** không trùng/mất cầu thủ, capacity đúng, kết quả hợp lý.

### Phase 5 — Auto spinning wheel (Cách B)

- [ ] SVG/CSS wheel animation mượt, đọc được tên, mobile friendly.
- [ ] State machine `idle -> spinning -> paused -> completed`.
- [ ] Start once, auto reveal, pause/resume/skip, reset.
- [ ] Chống double click/race condition; cleanup timer khi unmount.
- [ ] Reduced motion, accessibility live region thông báo kết quả.
- [ ] Không ghi DB khi animation chưa hoàn tất; chỉ lưu khi admin xác nhận.

**Done khi:** quay 24 người tự động không lỗi, pause/resume không làm đổi kết quả.

### Phase 6 — Publish, history & export

- [ ] RPC lưu session + assignments nguyên tử.
- [ ] Danh sách phiên published, trang chi tiết, latest result.
- [ ] Pitch7, starting/reserves, metrics.
- [ ] Export PNG sắc nét, hỗ trợ tiếng Việt và màn hình mobile.
- [ ] Kiểm tra viewer không thấy draft và không sửa published.

**Done khi:** admin publish, viewer mở link khác thiết bị xem đúng kết quả.

### Phase 7 — QA, deploy & handoff

- [ ] Build/lint/tests all green; test trên Chrome mobile/desktop.
- [ ] Test logout, session expiration, lỗi mạng, Supabase project paused.
- [ ] GitHub Actions deploy GitHub Pages, cấu hình secrets/vars phù hợp.
- [ ] Kiểm tra URL `https://<github-username>.github.io/football-ec-company/`.
- [ ] Viết README hướng dẫn local setup, Supabase setup, tạo admin, deploy, backup/export.
- [ ] Ghi rõ bước nào cần chủ tài khoản xác nhận và cách agent tiếp tục sau xác nhận.

**Done khi:** có website hoạt động công khai, admin quản lý được, viewer chỉ xem, không phát sinh phí ngoài quota.

---

## 8. Acceptance criteria / Definition of Done

- [ ] Tên hiển thị chính xác `Football EC Company`, repo `football-ec-company`.
- [ ] Không có backend server tự vận hành; không dùng MySQL.
- [ ] Chỉ 1 admin có quyền ghi, viewer xem không đăng nhập.
- [ ] Supabase RLS bật và test đủ CRUD, draft visibility, publish RPC.
- [ ] Chia 2/3 đội với sân 7; seed 1/2 và vị trí cân bằng trong giới hạn khả thi.
- [ ] Auto wheel chạy toàn bộ; pause/resume/skip; không đổi kết quả đã tính.
- [ ] 24 người / 2 đội, 24 người / 3 đội, trường hợp GK thiếu hoạt động đúng.
- [ ] Xuất ảnh PNG, xem lịch sử và share link.
- [ ] UI/UX mobile-first, dark sports theme, không overflow, thao tác thuận tiện.
- [ ] Tests + lint + build pass; deploy GitHub Pages thành công.
- [ ] Không có secret trong Git, không dùng dịch vụ bắt buộc trả phí.

---

## 9. Cách giao việc cho AI agent

**Prompt khởi động (copy nguyên văn):**

> Bạn là senior full-stack engineer kiêm product designer. Hãy đọc kỹ `football-ec-company-v2-agent-plan.md` và xây dựng dự án Football EC Company theo đúng từng phase. Ưu tiên UI/UX mobile-first, độ tin cậy của thuật toán, Supabase RLS và chi phí 0đ trong free tier. Không tự ý đổi stack, không tự tạo dịch vụ trả phí, không đưa secret vào code. Bắt đầu Phase 0; sau mỗi phase chạy build/lint/test, liệt kê file đã tạo, kết quả test, vấn đề còn tồn tại và chờ tôi xác nhận. Với thao tác trên GitHub/Supabase cần đăng nhập, xin tôi cấp quyền hoặc thực hiện bước xác nhận thay vì giả định đã có quyền. Dùng dữ liệu cầu thủ giả cho tới khi tôi cung cấp danh sách thật.

### Thông tin chủ dự án cần chuẩn bị

1. Tài khoản GitHub và quyền tạo repo, bật Pages/Actions.
2. Tài khoản Supabase free và quyền tạo project.
3. Email admin duy nhất và mật khẩu mạnh (chỉ nhập trong trang xác thực an toàn, không đưa vào prompt/code).
4. Danh sách cầu thủ thực tế: tên/biệt danh, seed 1/2, vị trí chính/phụ.
5. Đồng ý công khai tên/biệt danh + seed/vị trí cho người có link truy cập.

### Khi danh sách cầu thủ được cung cấp

- Agent tạo file import JSON/CSV hoặc script seed **không ghi đè dữ liệu thật ngoài ý muốn**.
- Kiểm tra trùng tên, chuẩn hóa mã vị trí, xác nhận seed, cảnh báo thiếu GK.
- Không thay đổi schema/thuật toán chỉ vì dữ liệu mới nếu không cần thiết.

---

## 10. Ghi chú về vận hành miễn phí

- Supabase free có giới hạn dung lượng, request, số project và chính sách inactivity; kiểm tra lại trên dashboard tại thời điểm triển khai.
- GitHub Pages miễn phí cho repo public theo điều kiện dịch vụ; không sử dụng Pages làm backend.
- Không kích hoạt add-on, compute nâng cấp, custom domain trả phí hay dịch vụ thanh toán tự động.
- Đặt nhắc việc định kỳ backup dữ liệu (ví dụ export JSON/CSV thủ công) và lưu migration trong Git.
- Nếu gói miễn phí không còn phù hợp, **dừng và xin quyết định của chủ dự án** trước khi chuyển sang dịch vụ khác; không âm thầm phát sinh chi phí.

**Kết luận:** Bản v2.0 dùng React + Supabase + GitHub Pages là kiến trúc đơn giản nhất có database online, phân quyền thật, chia sẻ giữa nhiều thiết bị, và khả năng vận hành miễn phí trong quota. Agent có thể triển khai toàn bộ mã nguồn; thao tác tài khoản cần sự ủy quyền/xác nhận của chủ sở hữu.
