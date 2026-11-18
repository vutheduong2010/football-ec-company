# Supabase setup — Football EC Company

Thư mục này chứa schema, RLS, RPC publish nguyên tử và kiểm thử quyền truy cập. Không lưu mật khẩu, database password, secret key hoặc service-role key trong repository.

## 1. Chạy local

Cần Docker và Supabase CLI:

```bash
npx supabase start
npx supabase db reset
npx supabase test db
```

`db reset` xóa database local và chạy lại toàn bộ migration. Không dùng lệnh này với database production.

## 2. Tạo project thật

1. Chủ tài khoản đăng nhập Supabase và tạo một project Free.
2. Trong Authentication, tắt public signup. Ứng dụng không có màn hình đăng ký.
3. Liên kết CLI bằng luồng đăng nhập an toàn; không đưa access token hoặc database password vào code/prompt:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

Có thể chạy migration bằng SQL Editor nếu không dùng CLI, nhưng phải chạy nguyên file `migrations/202611130001_initial_schema.sql`.

## 3. Tạo đúng một admin

1. Tạo user email/password trong Supabase Dashboard → Authentication → Users. Không bật signup công khai.
2. Sao chép UUID của user.
3. Trong SQL Editor, chạy bằng quyền quản trị:

```sql
insert into public.app_admins (user_id)
values ('UUID_CUA_ADMIN');
```

Không có policy hoặc UI cho phép client thêm/xóa admin. Muốn đổi admin phải thao tác quản trị an toàn trong Dashboard/SQL Editor.

## 4. Cấu hình frontend

Sao chép `.env.example` thành `.env.local`:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
```

Publishable/anon key được phép xuất hiện trong frontend khi RLS đã bật và kiểm thử. Tuyệt đối không dùng secret key hoặc service-role key trong Vite.

Vitest dùng `.env.test` với giá trị placeholder để luôn chạy trên dữ liệu mẫu, không gửi request tới project production. Không thay file này bằng key thật.

## 5. Mô hình quyền

- `anon`: đọc cầu thủ, phiên `published` và assignments của phiên `published`.
- `authenticated` không nằm trong `app_admins`: quyền đọc giống viewer, không được ghi.
- Admin trong `app_admins`: CRUD cầu thủ, đọc draft, tạo/xóa draft.
- Chỉ RPC `publish_draw(...)` có thể tạo phiên `published` cùng assignments trong một transaction.
- Phiên và assignments đã publish bị trigger bảo vệ khỏi update/delete.
- Client không có quyền đọc hoặc ghi trực tiếp bảng `app_admins`.

Hồ sơ cầu thủ dùng ba hạt giống `1` (mạnh), `2` (trung bình), `3` (yếu) và sáu vị trí `GK`, `CB`, `LB`, `RB`, `CM`, `ST`. Migration `202611150001_three_seeds_and_positions.sql` tự chuyển các vị trí cũ `CAM`, `LM`, `RM` về `CM` và không xóa cầu thủ.

Migration `202611150003_lineup_positions_and_admin_delete.sql` snapshot tối đa ba vị trí phụ trong kết quả công bố và thêm RPC `delete_published_draw` chỉ dành cho admin.

Migration `202611150004_post_match_results.sql` bổ sung tỉ số cho trận hai đội, thứ hạng cho bảng ba đội và RPC `set_published_draw_result` chỉ dành cho admin.

Migration `202611150005_live_draw_room.sql` tạo trạng thái chia đội trực tiếp dạng singleton, cho viewer đọc/subscribe qua Supabase Realtime và chỉ cho admin cập nhật.

Migration `202611180001_player_avatars.sql` thêm đường dẫn avatar cho cầu thủ và snapshot kết quả, đồng thời tạo bucket public `player-avatars` giới hạn 5 MB với quyền upload/xóa chỉ dành cho admin.

RLS là lớp bảo mật thật. `isAdmin` trong React chỉ dùng để điều chỉnh UX.

## 6. Kiểm tra trước khi dùng production

```bash
npx supabase db lint --remote
npx supabase test db
```

Sau khi deploy migration, kiểm tra thêm bằng hai browser profile:

1. Không đăng nhập: SELECT public hoạt động; mọi mutation bị từ chối.
2. Đăng nhập user không thuộc `app_admins`: mutation vẫn bị từ chối.
3. Đăng nhập admin: CRUD cầu thủ hoạt động.
4. Gọi `publish_draw` với dữ liệu lỗi: toàn transaction rollback, không có session nửa chừng.
5. Thử update/delete session published: database trả lỗi immutable.

Chạy Security Advisor/Database Linter trong Dashboard và xử lý mọi cảnh báo trước khi nhập dữ liệu thật.

## 7. Rollback và backup

File `rollback/202611130001_initial_schema_down.sql` xóa toàn bộ bảng và dữ liệu của ứng dụng, chỉ dùng khi chủ dự án xác nhận rõ ràng. Ưu tiên backup trước và tạo migration sửa lỗi tiến lên thay vì rollback production.

Tài liệu tham chiếu:

- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/database/functions
- https://supabase.com/docs/guides/database/postgres/testing-row-level-security
