begin;

alter table public.draw_sessions
  add column team_scores smallint[],
  add column team_rankings smallint[];

create or replace function private.valid_team_scores(p_scores smallint[])
returns boolean
language sql
immutable
set search_path = ''
as $$
  select
    cardinality(p_scores) = 2
    and not exists (
      select 1
      from unnest(p_scores) as scores(score)
      where score is null or score < 0 or score > 99
    );
$$;

create or replace function private.valid_team_rankings(p_rankings smallint[])
returns boolean
language sql
immutable
set search_path = ''
as $$
  select
    cardinality(p_rankings) = 3
    and p_rankings @> array[0, 1, 2]::smallint[]
    and p_rankings <@ array[0, 1, 2]::smallint[];
$$;

revoke execute on function private.valid_team_scores(smallint[]) from public, anon, authenticated;
revoke execute on function private.valid_team_rankings(smallint[]) from public, anon, authenticated;

alter table public.draw_sessions
  add constraint draw_sessions_post_match_result_check check (
    (
      team_count = 2
      and team_rankings is null
      and (team_scores is null or private.valid_team_scores(team_scores))
    )
    or
    (
      team_count = 3
      and team_scores is null
      and (team_rankings is null or private.valid_team_rankings(team_rankings))
    )
  );

create or replace function private.protect_published_session()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status = 'published' then
    if tg_op = 'DELETE'
      and coalesce(current_setting('football_ec.allow_published_delete', true), '') = 'on' then
      return old;
    end if;

    if tg_op = 'UPDATE'
      and coalesce(current_setting('football_ec.allow_result_update', true), '') = 'on' then
      if (to_jsonb(new) - 'team_scores' - 'team_rankings')
        is distinct from (to_jsonb(old) - 'team_scores' - 'team_rankings') then
        raise exception 'Only the post-match result may be updated.' using errcode = '55000';
      end if;
      return new;
    end if;

    raise exception 'Published draw sessions are immutable.' using errcode = '55000';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create or replace function public.set_published_draw_result(
  p_session_id uuid,
  p_team_scores smallint[],
  p_team_rankings smallint[]
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_team_count smallint;
begin
  if v_user_id is null or not exists (
    select 1 from public.app_admins where user_id = v_user_id
  ) then
    raise exception 'Admin access required.' using errcode = '42501';
  end if;

  select team_count
  into v_team_count
  from public.draw_sessions
  where id = p_session_id and status = 'published'
  for update;

  if v_team_count is null then
    raise exception 'Published draw session not found.' using errcode = 'P0002';
  end if;

  if v_team_count = 2 then
    if p_team_rankings is not null
      or p_team_scores is null
      or not private.valid_team_scores(p_team_scores) then
      raise exception 'A two-team result requires two scores from 0 to 99.' using errcode = '22023';
    end if;
  elsif v_team_count = 3 then
    if p_team_scores is not null
      or p_team_rankings is null
      or not private.valid_team_rankings(p_team_rankings) then
      raise exception 'A three-team result requires unique rankings for teams 0, 1 and 2.' using errcode = '22023';
    end if;
  end if;

  perform set_config('football_ec.allow_result_update', 'on', true);
  update public.draw_sessions
  set
    team_scores = p_team_scores,
    team_rankings = p_team_rankings
  where id = p_session_id;

  return true;
end;
$$;

revoke execute on function public.set_published_draw_result(uuid, smallint[], smallint[])
from public, anon;
grant execute on function public.set_published_draw_result(uuid, smallint[], smallint[])
to authenticated;

comment on column public.draw_sessions.team_scores is
  'Final score ordered by team index for a two-team published draw.';
comment on column public.draw_sessions.team_rankings is
  'Team indexes ordered first to third for a three-team published draw.';
comment on function public.set_published_draw_result(uuid, smallint[], smallint[]) is
  'Allows only an application admin to record the final score or ranking.';

commit;
