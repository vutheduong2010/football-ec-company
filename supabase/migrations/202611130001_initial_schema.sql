begin;

create schema if not exists private;
revoke all on schema private from public;

create or replace function private.valid_secondary_positions(
  p_primary text,
  p_secondary text[]
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select
    p_primary = any (array['GK', 'CB', 'LB', 'RB', 'CM', 'CAM', 'LM', 'RM', 'ST']::text[])
    and coalesce(cardinality(p_secondary), 0) <= 2
    and not (p_primary = any (coalesce(p_secondary, '{}'::text[])))
    and not exists (
      select 1
      from unnest(coalesce(p_secondary, '{}'::text[])) as positions(position)
      where position <> all (array['GK', 'CB', 'LB', 'RB', 'CM', 'CAM', 'LM', 'RM', 'ST']::text[])
    )
    and (
      select count(*) = count(distinct position)
      from unnest(coalesce(p_secondary, '{}'::text[])) as positions(position)
    );
$$;

revoke execute on function private.valid_secondary_positions(text, text[])
from public, anon, authenticated;
grant usage on schema private to authenticated;
grant execute on function private.valid_secondary_positions(text, text[])
to authenticated;

create table public.app_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  nickname text,
  seed smallint not null,
  primary_position text not null,
  secondary_positions text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint players_name_length check (char_length(btrim(name)) between 1 and 80),
  constraint players_nickname_length check (
    nickname is null or char_length(btrim(nickname)) between 1 and 50
  ),
  constraint players_seed_check check (seed in (1, 2)),
  constraint players_primary_position_check check (
    primary_position in ('GK', 'CB', 'LB', 'RB', 'CM', 'CAM', 'LM', 'RM', 'ST')
  ),
  constraint players_secondary_positions_check check (
    private.valid_secondary_positions(primary_position, secondary_positions)
  )
);

create table public.draw_sessions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  match_date date not null,
  team_count smallint not null,
  field_size smallint not null default 7,
  status text not null,
  created_by uuid not null references auth.users(id),
  algorithm_version text not null,
  draw_seed text not null,
  created_at timestamptz not null default now(),
  published_at timestamptz,
  constraint draw_sessions_title_length check (char_length(btrim(title)) between 1 and 120),
  constraint draw_sessions_team_count_check check (team_count in (2, 3)),
  constraint draw_sessions_field_size_check check (field_size = 7),
  constraint draw_sessions_status_check check (status in ('draft', 'published')),
  constraint draw_sessions_algorithm_version_length check (
    char_length(btrim(algorithm_version)) between 1 and 50
  ),
  constraint draw_sessions_seed_length check (char_length(btrim(draw_seed)) between 1 and 200),
  constraint draw_sessions_published_at_check check (
    (status = 'draft' and published_at is null)
    or (status = 'published' and published_at is not null)
  )
);

create table public.draw_assignments (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.draw_sessions(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete restrict,
  team_index smallint not null,
  is_starting boolean not null default false,
  reveal_order integer not null,
  player_name_snapshot text not null,
  seed_snapshot smallint not null,
  position_snapshot text not null,
  constraint draw_assignments_team_index_check check (team_index between 0 and 2),
  constraint draw_assignments_reveal_order_check check (reveal_order >= 0),
  constraint draw_assignments_player_name_length check (
    char_length(btrim(player_name_snapshot)) between 1 and 80
  ),
  constraint draw_assignments_seed_check check (seed_snapshot in (1, 2)),
  constraint draw_assignments_position_check check (
    position_snapshot in ('GK', 'CB', 'LB', 'RB', 'CM', 'CAM', 'LM', 'RM', 'ST')
  ),
  unique (session_id, player_id),
  unique (session_id, reveal_order)
);

create index draw_sessions_status_match_date_idx
  on public.draw_sessions (status, match_date desc);
create index draw_sessions_created_by_idx
  on public.draw_sessions (created_by);
create index draw_assignments_session_team_idx
  on public.draw_assignments (session_id, team_index);
create index draw_assignments_player_idx
  on public.draw_assignments (player_id);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger players_set_updated_at
before update on public.players
for each row execute function private.set_updated_at();

create or replace function private.protect_published_session()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status = 'published' then
    raise exception 'Published draw sessions are immutable.' using errcode = '55000';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger draw_sessions_protect_published
before update or delete on public.draw_sessions
for each row execute function private.protect_published_session();

create or replace function private.protect_published_assignment()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (
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

create trigger draw_assignments_protect_published
before update or delete on public.draw_assignments
for each row execute function private.protect_published_assignment();

revoke execute on function private.set_updated_at() from public, anon, authenticated;
revoke execute on function private.protect_published_session() from public, anon, authenticated;
revoke execute on function private.protect_published_assignment() from public, anon, authenticated;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select auth.uid()) is not null
    and exists (
      select 1
      from public.app_admins
      where user_id = (select auth.uid())
    );
$$;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

alter table public.app_admins enable row level security;
alter table public.players enable row level security;
alter table public.draw_sessions enable row level security;
alter table public.draw_assignments enable row level security;

revoke all on table public.app_admins from anon, authenticated;

revoke all on table public.players from anon, authenticated;
grant select on table public.players to anon, authenticated;
grant insert, update, delete on table public.players to authenticated;

revoke all on table public.draw_sessions from anon, authenticated;
grant select on table public.draw_sessions to anon, authenticated;
grant insert, update, delete on table public.draw_sessions to authenticated;

revoke all on table public.draw_assignments from anon, authenticated;
grant select on table public.draw_assignments to anon, authenticated;

create policy players_public_read
on public.players
for select
to anon, authenticated
using (true);

create policy players_admin_insert
on public.players
for insert
to authenticated
with check ((select public.is_admin()));

create policy players_admin_update
on public.players
for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy players_admin_delete
on public.players
for delete
to authenticated
using ((select public.is_admin()));

create policy draw_sessions_public_read_published
on public.draw_sessions
for select
to anon
using (status = 'published');

create policy draw_sessions_authenticated_read
on public.draw_sessions
for select
to authenticated
using (status = 'published' or (select public.is_admin()));

create policy draw_sessions_admin_insert_draft
on public.draw_sessions
for insert
to authenticated
with check (
  (select public.is_admin())
  and status = 'draft'
  and created_by = (select auth.uid())
);

create policy draw_sessions_admin_update_draft
on public.draw_sessions
for update
to authenticated
using ((select public.is_admin()) and status = 'draft')
with check (
  (select public.is_admin())
  and status = 'draft'
  and created_by = (select auth.uid())
);

create policy draw_sessions_admin_delete_draft
on public.draw_sessions
for delete
to authenticated
using ((select public.is_admin()) and status = 'draft');

create policy draw_assignments_public_read_published
on public.draw_assignments
for select
to anon
using (
  exists (
    select 1
    from public.draw_sessions
    where draw_sessions.id = draw_assignments.session_id
      and draw_sessions.status = 'published'
  )
);

create policy draw_assignments_authenticated_read
on public.draw_assignments
for select
to authenticated
using (
  (select public.is_admin())
  or exists (
    select 1
    from public.draw_sessions
    where draw_sessions.id = draw_assignments.session_id
      and draw_sessions.status = 'published'
  )
);

create or replace function public.publish_draw(
  p_title text,
  p_match_date date,
  p_team_count smallint,
  p_algorithm_version text,
  p_draw_seed text,
  p_assignments jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_session_id uuid;
  v_assignment_count integer;
  v_unique_players integer;
  v_unique_reveal_orders integer;
  v_min_team_size integer;
  v_max_team_size integer;
begin
  if v_user_id is null or not exists (
    select 1 from public.app_admins where user_id = v_user_id
  ) then
    raise exception 'Admin access required.' using errcode = '42501';
  end if;

  if p_title is null or char_length(btrim(p_title)) not between 1 and 120 then
    raise exception 'Invalid draw title.' using errcode = '22023';
  end if;
  if p_match_date is null then
    raise exception 'Match date is required.' using errcode = '22023';
  end if;
  if p_team_count is null or p_team_count not in (2, 3) then
    raise exception 'Team count must be 2 or 3.' using errcode = '22023';
  end if;
  if p_algorithm_version is null
    or char_length(btrim(p_algorithm_version)) not between 1 and 50 then
    raise exception 'Invalid algorithm version.' using errcode = '22023';
  end if;
  if p_draw_seed is null or char_length(btrim(p_draw_seed)) not between 1 and 200 then
    raise exception 'Invalid draw seed.' using errcode = '22023';
  end if;
  if p_assignments is null or jsonb_typeof(p_assignments) <> 'array' then
    raise exception 'Assignments must be a JSON array.' using errcode = '22023';
  end if;

  v_assignment_count := jsonb_array_length(p_assignments);
  if v_assignment_count < p_team_count then
    raise exception 'There must be at least one player per team.' using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_assignments) as assignments(assignment)
    where jsonb_typeof(assignment) <> 'object'
      or coalesce(assignment->>'player_id', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      or coalesce(assignment->>'team_index', '') !~ '^[0-2]$'
      or (assignment->>'team_index')::integer >= p_team_count
      or coalesce(assignment->>'reveal_order', '') !~ '^[0-9]+$'
      or (assignment->>'reveal_order')::integer >= v_assignment_count
      or (
        assignment ? 'is_starting'
        and jsonb_typeof(assignment->'is_starting') <> 'boolean'
      )
  ) then
    raise exception 'One or more assignments are malformed.' using errcode = '22023';
  end if;

  select
    count(distinct (assignment->>'player_id')::uuid),
    count(distinct (assignment->>'reveal_order')::integer)
  into v_unique_players, v_unique_reveal_orders
  from jsonb_array_elements(p_assignments) as assignments(assignment);

  if v_unique_players <> v_assignment_count then
    raise exception 'Each player must appear exactly once.' using errcode = '23505';
  end if;
  if v_unique_reveal_orders <> v_assignment_count then
    raise exception 'Reveal orders must be unique and contiguous.' using errcode = '23505';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_assignments) as assignments(assignment)
    left join public.players
      on players.id = (assignment->>'player_id')::uuid
    where players.id is null or not players.is_active
  ) then
    raise exception 'Assignments contain a missing or inactive player.' using errcode = '23503';
  end if;

  select min(team_size), max(team_size)
  into v_min_team_size, v_max_team_size
  from (
    select team_number, count(assignment) as team_size
    from generate_series(0, p_team_count - 1) as teams(team_number)
    left join lateral (
      select assignment
      from jsonb_array_elements(p_assignments) as assignments(assignment)
      where (assignment->>'team_index')::integer = team_number
    ) as assigned on true
    group by team_number
  ) as team_sizes;

  if v_max_team_size - v_min_team_size > 1 then
    raise exception 'Team sizes may differ by at most one player.' using errcode = '23514';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_assignments) as assignments(assignment)
    where coalesce((assignment->>'is_starting')::boolean, false)
    group by (assignment->>'team_index')::integer
    having count(*) > 7
  ) then
    raise exception 'A team cannot have more than seven starting players.' using errcode = '23514';
  end if;

  insert into public.draw_sessions (
    title,
    match_date,
    team_count,
    field_size,
    status,
    created_by,
    algorithm_version,
    draw_seed,
    published_at
  ) values (
    btrim(p_title),
    p_match_date,
    p_team_count,
    7,
    'published',
    v_user_id,
    btrim(p_algorithm_version),
    btrim(p_draw_seed),
    now()
  )
  returning id into v_session_id;

  insert into public.draw_assignments (
    session_id,
    player_id,
    team_index,
    is_starting,
    reveal_order,
    player_name_snapshot,
    seed_snapshot,
    position_snapshot
  )
  select
    v_session_id,
    players.id,
    (assignment->>'team_index')::smallint,
    coalesce((assignment->>'is_starting')::boolean, false),
    (assignment->>'reveal_order')::integer,
    players.name,
    players.seed,
    players.primary_position
  from jsonb_array_elements(p_assignments) as assignments(assignment)
  join public.players
    on players.id = (assignment->>'player_id')::uuid;

  return v_session_id;
end;
$$;

revoke execute on function public.publish_draw(text, date, smallint, text, text, jsonb)
from public, anon;
grant execute on function public.publish_draw(text, date, smallint, text, text, jsonb)
to authenticated;

comment on table public.app_admins is
  'Allow-list for the single application administrator. Client roles have no table privileges.';
comment on function public.publish_draw(text, date, smallint, text, text, jsonb) is
  'Atomically validates and publishes one immutable draw session with snapshot assignments.';

commit;
