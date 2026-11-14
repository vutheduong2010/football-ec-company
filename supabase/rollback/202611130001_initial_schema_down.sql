begin;

drop function if exists public.publish_draw(text, date, smallint, text, text, jsonb);
drop function if exists public.is_admin();
drop table if exists public.draw_assignments;
drop table if exists public.draw_sessions;
drop table if exists public.players;
drop table if exists public.app_admins;
drop schema if exists private cascade;

commit;
