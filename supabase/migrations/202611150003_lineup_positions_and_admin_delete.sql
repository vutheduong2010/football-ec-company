begin;

alter table public.draw_assignments
  add column secondary_positions_snapshot text[] not null default '{}'::text[];

create or replace function private.valid_snapshot_secondary_positions(
  p_primary text,
  p_secondary text[]
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select
    coalesce(cardinality(p_secondary), 0) <= 3
    and not (p_primary = any (coalesce(p_secondary, '{}'::text[])))
    and not exists (
      select 1
      from unnest(coalesce(p_secondary, '{}'::text[])) as positions(position)
      where position <> all (array['GK', 'CB', 'LB', 'RB', 'CM', 'ST']::text[])
    )
    and (
      select count(*) = count(distinct position)
      from unnest(coalesce(p_secondary, '{}'::text[])) as positions(position)
    );
$$;

revoke execute on function private.valid_snapshot_secondary_positions(text, text[])
from public, anon, authenticated;

alter table public.draw_assignments
  add constraint draw_assignments_secondary_positions_check check (
    private.valid_snapshot_secondary_positions(
      position_snapshot,
      secondary_positions_snapshot
    )
  );

create or replace function private.set_assignment_display_name_snapshot()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_display_name text;
  v_secondary_positions text[];
begin
  select
    coalesce(nullif(btrim(players.nickname), ''), btrim(players.name)),
    players.secondary_positions
  into v_display_name, v_secondary_positions
  from public.players
  where players.id = new.player_id;

  if v_display_name is null then
    raise exception 'Cannot snapshot a missing player.' using errcode = '23503';
  end if;

  new.player_name_snapshot := v_display_name;
  new.secondary_positions_snapshot := coalesce(v_secondary_positions, '{}'::text[]);
  return new;
end;
$$;

create or replace function private.protect_published_session()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status = 'published'
    and coalesce(current_setting('football_ec.allow_published_delete', true), '') <> 'on' then
    raise exception 'Published draw sessions are immutable.' using errcode = '55000';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create or replace function private.protect_published_assignment()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if coalesce(current_setting('football_ec.allow_published_delete', true), '') <> 'on'
    and exists (
      select 1
      from public.draw_sessions
      where id = old.session_id and status = 'published'
    ) then
    raise exception 'Assignments in a published session are immutable.' using errcode = '55000';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create or replace function public.delete_published_draw(p_session_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null or not exists (
    select 1 from public.app_admins where user_id = v_user_id
  ) then
    raise exception 'Admin access required.' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.draw_sessions
    where id = p_session_id and status = 'published'
    for update
  ) then
    raise exception 'Published draw session not found.' using errcode = 'P0002';
  end if;

  perform set_config('football_ec.allow_published_delete', 'on', true);
  delete from public.draw_assignments where session_id = p_session_id;
  delete from public.draw_sessions where id = p_session_id;
  return true;
end;
$$;

revoke execute on function public.delete_published_draw(uuid) from public, anon;
grant execute on function public.delete_published_draw(uuid) to authenticated;

comment on column public.draw_assignments.secondary_positions_snapshot is
  'Immutable secondary positions used to reconstruct the published lineup.';
comment on function public.delete_published_draw(uuid) is
  'Deletes one published draw and its assignments after an explicit admin authorization check.';

commit;
