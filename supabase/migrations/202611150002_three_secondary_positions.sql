begin;

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
    and coalesce(cardinality(p_secondary), 0) <= 3
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

comment on function private.valid_secondary_positions(text, text[]) is
  'Validates one primary position and up to three unique secondary positions.';

commit;
