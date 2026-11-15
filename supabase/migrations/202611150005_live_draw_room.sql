begin;

create table public.live_draw_state (
  id smallint primary key default 1,
  state jsonb not null default '{
    "version": 1,
    "selectedPlayerIds": [],
    "teamCount": 2,
    "preview": null,
    "wheel": {"status": "idle", "revealedCount": 0},
    "matchTitle": "",
    "matchDate": ""
  }'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint live_draw_state_singleton check (id = 1),
  constraint live_draw_state_object check (jsonb_typeof(state) = 'object')
);

insert into public.live_draw_state (id) values (1);

create or replace function private.touch_live_draw_state()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_by := (select auth.uid());
  new.updated_at := now();
  return new;
end;
$$;

create trigger live_draw_state_touch
before update on public.live_draw_state
for each row execute function private.touch_live_draw_state();

alter table public.live_draw_state enable row level security;

revoke all on table public.live_draw_state from anon, authenticated;
grant select on table public.live_draw_state to anon, authenticated;
grant update (state) on table public.live_draw_state to authenticated;

create policy live_draw_state_public_read
on public.live_draw_state
for select
to anon, authenticated
using (true);

create policy live_draw_state_admin_update
on public.live_draw_state
for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

alter publication supabase_realtime add table public.live_draw_state;

comment on table public.live_draw_state is
  'Singleton snapshot used to mirror the admin draw workflow to read-only viewers.';
comment on column public.live_draw_state.state is
  'Versioned JSON snapshot of attendance, balance preview and wheel progress.';

commit;
