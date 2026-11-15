begin;

alter table public.players
  drop constraint players_seed_check,
  drop constraint players_primary_position_check,
  drop constraint players_secondary_positions_check;

alter table public.draw_assignments
  drop constraint draw_assignments_seed_check;

-- Collapse legacy midfield roles into the new CM role without deleting players.
update public.players
set primary_position = case
  when primary_position in ('CAM', 'LM', 'RM') then 'CM'
  else primary_position
end
where primary_position in ('CAM', 'LM', 'RM');

update public.players as players
set secondary_positions = coalesce(
  (
    select array_agg(normalized.position order by normalized.first_ordinal)
    from (
      select
        mapped.position,
        min(positions.ordinality) as first_ordinal
      from unnest(players.secondary_positions) with ordinality as positions(position, ordinality)
      cross join lateral (
        values (
          case
            when positions.position in ('CAM', 'LM', 'RM') then 'CM'
            else positions.position
          end
        )
      ) as mapped(position)
      where mapped.position in ('GK', 'CB', 'LB', 'RB', 'CM', 'ST')
        and mapped.position <> players.primary_position
      group by mapped.position
      order by min(positions.ordinality)
      limit 2
    ) as normalized
  ),
  '{}'::text[]
);

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
    p_primary = any (array['GK', 'CB', 'LB', 'RB', 'CM', 'ST']::text[])
    and coalesce(cardinality(p_secondary), 0) <= 2
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

alter table public.players
  add constraint players_seed_check check (seed in (1, 2, 3)),
  add constraint players_primary_position_check check (
    primary_position in ('GK', 'CB', 'LB', 'RB', 'CM', 'ST')
  ),
  add constraint players_secondary_positions_check check (
    private.valid_secondary_positions(primary_position, secondary_positions)
  );

-- Published history remains immutable; only widen its snapshot seed constraint.
alter table public.draw_assignments
  add constraint draw_assignments_seed_check check (seed_snapshot in (1, 2, 3));

create or replace function private.set_assignment_display_name_snapshot()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_display_name text;
begin
  select coalesce(nullif(btrim(players.nickname), ''), btrim(players.name))
  into v_display_name
  from public.players
  where players.id = new.player_id;

  if v_display_name is null then
    raise exception 'Cannot snapshot a missing player.' using errcode = '23503';
  end if;

  new.player_name_snapshot := v_display_name;
  return new;
end;
$$;

revoke execute on function private.set_assignment_display_name_snapshot()
from public, anon, authenticated;

drop trigger if exists draw_assignments_set_display_name_snapshot
on public.draw_assignments;

create trigger draw_assignments_set_display_name_snapshot
before insert on public.draw_assignments
for each row execute function private.set_assignment_display_name_snapshot();

comment on function private.set_assignment_display_name_snapshot() is
  'Snapshots nickname first and falls back to the player name for immutable published results.';

commit;
