begin;

alter table public.players
  add column avatar_path text;

alter table public.players
  add constraint players_avatar_path_check check (
    avatar_path is null
    or (
      avatar_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp)$'
      and split_part(avatar_path, '/', 1) = id::text
    )
  );

alter table public.draw_assignments
  add column avatar_path_snapshot text;

alter table public.draw_assignments
  add constraint draw_assignments_avatar_path_snapshot_check check (
    avatar_path_snapshot is null
    or avatar_path_snapshot ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp)$'
  );

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
) values (
  'player-avatars',
  'player-avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy player_avatars_admin_select
on storage.objects
for select
to authenticated
using (
  bucket_id = 'player-avatars'
  and (select public.is_admin())
);

create policy player_avatars_admin_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'player-avatars'
  and (select public.is_admin())
);

create policy player_avatars_admin_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'player-avatars'
  and (select public.is_admin())
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
  v_avatar_path text;
begin
  select
    coalesce(nullif(btrim(players.nickname), ''), btrim(players.name)),
    players.secondary_positions,
    players.avatar_path
  into v_display_name, v_secondary_positions, v_avatar_path
  from public.players
  where players.id = new.player_id;

  if v_display_name is null then
    raise exception 'Cannot snapshot a missing player.' using errcode = '23503';
  end if;

  new.player_name_snapshot := v_display_name;
  new.secondary_positions_snapshot := coalesce(v_secondary_positions, '{}'::text[]);
  new.avatar_path_snapshot := v_avatar_path;
  return new;
end;
$$;

comment on column public.players.avatar_path is
  'Object path in the public player-avatars bucket; null uses the application default avatar.';
comment on column public.draw_assignments.avatar_path_snapshot is
  'Immutable avatar object path captured when the draw is published.';

commit;
