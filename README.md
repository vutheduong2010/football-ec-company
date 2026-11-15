# Football EC Company

Website chia đội bóng sân 7 ngẫu nhiên có ràng buộc cân bằng, tối ưu cho điện thoại và vận hành miễn phí trong quota của GitHub Pages + Supabase.

**Production:** <https://vutheduong2010.github.io/football-ec-company/>

Frontend là ứng dụng React tĩnh trên GitHub Pages. Supabase cung cấp PostgreSQL, Auth và Row Level Security; dự án không có backend server tự vận hành.

## Tính năng

- Danh sách cầu thủ với ba hạt giống: 1 mạnh, 2 trung bình, 3 yếu.
- Sáu vị trí `GK`, `CB`, `LB`, `RB`, `CM`, `ST`; mỗi cầu thủ có một vị trí chính và tối đa ba vị trí phụ.
- Khi một đội có hơn bảy người, suất đá chính được ưu tiên lần lượt cho H1, H2 rồi H3; cùng hạt giống vẫn được xáo trộn theo mã quay.
- Sơ đồ sân 7 ưu tiên để mọi cầu thủ có vị trí phù hợp, hạn chế xếp linh hoạt; trong các phương án phù hợp mới ưu tiên vị trí chính trước vị trí phụ.
- Chia 2 hoặc 3 đội bằng PRNG deterministic, chọn trong nhiều phương án cân bằng.
- Vòng quay tự động có pause/resume/skip và không làm đổi kết quả đã tính.
- Publish session + assignments nguyên tử bằng PostgreSQL RPC.
- Lịch sử public chỉ gồm phiên đã công bố, đội hình sân 7, dự bị và metrics.
- Màn hình chi tiết cho phép kéo thả để đổi hai vị trí trên sân hoặc hoán đổi cầu thủ đá chính với dự bị trong phiên xem hiện tại.
- Admin có thể xóa kết quả đã công bố qua RPC được bảo vệ; viewer nhìn thấy nút xóa ở trạng thái vô hiệu hóa.
- Sơ đồ và kết quả ưu tiên biệt danh; nếu trống mới hiển thị tên cầu thủ.
- Chia sẻ liên kết và xuất PNG sắc nét.
- Một admin trong allow-list; viewer không cần đăng nhập và chỉ có quyền đọc.

## Chạy local

Yêu cầu Node.js 24 và npm 11+.

```bash
npm ci
```

Sao chép `.env.example` thành `.env.local`, sau đó điền URL và publishable/anon key của Supabase:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
```

Chỉ dùng publishable/anon key ở frontend. Không dùng hoặc commit secret key, service-role key, access token hay mật khẩu.

```bash
npm run dev
```

Nếu không có `.env.local`, ứng dụng chạy với dữ liệu mẫu ở chế độ chỉ đọc. Vitest luôn dùng `.env.test` placeholder để không kết nối nhầm database production.

## Kiểm tra chất lượng

```bash
npm run format:check
npm run lint
npm test
npm run build
```

Kiểm tra database local khi Docker đang chạy:

```bash
npm run db:start
npm run db:reset
npm run db:lint
npm run test:db
npm run db:stop
```

`db:reset` xóa database local. Không chạy lệnh này với production.

## Thiết lập Supabase

Hướng dẫn migration, tắt public signup, tạo admin, RLS, kiểm thử quyền và rollback nằm tại [`supabase/README.md`](supabase/README.md).

Tóm tắt production:

1. Liên kết project bằng `npx supabase link --project-ref <PROJECT_REF>`.
2. Chạy `npx supabase db push` để áp dụng migration.
3. Tắt public signup trong Authentication.
4. Tạo user admin trong Dashboard và thêm UUID của user vào `public.app_admins`.
5. Kiểm tra viewer không thấy draft, không ghi được dữ liệu và không sửa/xóa phiên published.

RLS là lớp bảo mật thật. Trạng thái `isAdmin` trong React chỉ điều chỉnh giao diện.

## Deploy GitHub Pages

Ứng dụng dùng `HashRouter` và Vite `base: '/football-ec-company/'`, phù hợp URL Project Pages.

Trong repository GitHub:

1. Mở **Settings → Secrets and variables → Actions**.
2. Tạo repository variable `VITE_SUPABASE_URL`.
3. Tạo repository secret `VITE_SUPABASE_ANON_KEY` chứa publishable/anon key.
4. Mở **Settings → Pages → Build and deployment** và chọn **GitHub Actions**.
5. Push lên `main` hoặc chạy workflow **Deploy GitHub Pages** thủ công.

Workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) chạy format, lint, toàn bộ test, build rồi mới deploy `dist/`. URL deploy được ghi vào environment `github-pages`.

## Kiểm tra sau deploy

- Mở trang chủ và `/football-ec-company/#/results` ở desktop và mobile.
- Ở cửa sổ ẩn danh, xác nhận xem được players/published results nhưng không thấy draft.
- Đăng nhập admin, thêm/sửa một cầu thủ thử nghiệm rồi hoàn tác dữ liệu thử.
- Chạy một lượt chia đội, publish và mở link kết quả bằng cửa sổ ẩn danh.
- Thử xuất PNG, đăng xuất và xác nhận route `/draw` yêu cầu đăng nhập lại.
- Khi lỗi mạng hoặc Supabase bị pause, ứng dụng phải hiển thị lỗi và không cấp quyền admin.

## Backup và phục hồi

- Schema, RLS, functions và triggers được lưu trong `supabase/migrations/`; đây là nguồn sự thật để dựng lại cấu trúc.
- Định kỳ xuất CSV các bảng `players`, `draw_sessions` và `draw_assignments` từ Supabase Dashboard, lưu ở nơi riêng tư có ngày backup.
- Lịch sử thi đấu lưu tỉ số hai đội hoặc thứ hạng ba đội ngay trên `draw_sessions`; chỉ admin được cập nhật kết quả sau trận.
- Trước migration lớn, tạo database backup bằng công cụ Supabase/PostgreSQL phù hợp với gói đang dùng.
- Ưu tiên migration sửa tiến lên. Chỉ dùng file trong `supabase/rollback/` khi đã backup và chủ tài khoản xác nhận rõ ràng.
- Không commit file backup chứa dữ liệu người dùng hoặc thông tin xác thực.

## Xử lý sự cố vận hành

- **Trang trắng hoặc asset 404:** kiểm tra Vite `base`, Pages source và artifact `dist`.
- **Workflow build ở chế độ demo:** kiểm tra đúng tên variable/secret GitHub Actions.
- **Không đăng nhập được:** kiểm tra email đã xác nhận, user nằm trong `app_admins`, public signup vẫn tắt.
- **Supabase paused:** mở project trong Dashboard, chờ project hoạt động rồi thử lại.
- **Viewer thấy/ghi được dữ liệu ngoài ý muốn:** dừng nhập dữ liệu mới, kiểm tra RLS và migration trước khi tiếp tục.

Các thay đổi cần chủ tài khoản xác nhận: đổi admin, rotate key, xóa dữ liệu, rollback production, nâng gói trả phí, đổi domain hoặc thay nhà cung cấp. Các thay đổi mã thông thường được kiểm tra và deploy qua workflow trên `main`.

## Công nghệ

- React 19 + TypeScript + Vite
- Tailwind CSS, React Router, Lucide React
- Vitest + Testing Library
- Supabase PostgreSQL + Auth + RLS
- GitHub Actions + GitHub Pages

Kế hoạch triển khai nằm trong [`football-ec-company-v2-agent-plan.md`](football-ec-company-v2-agent-plan.md). Phase 0–7 đã hoàn thành.
