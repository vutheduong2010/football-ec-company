begin;

create extension if not exists pgtap with schema extensions;
select plan(46);

insert into auth.users (
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) values
  (
    '00000000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'admin-test@example.com',
    '',
    now(),
    '{}',
    '{}',
    now(),
    now()
  ),
  (
    '00000000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'viewer-test@example.com',
    '',
    now(),
    '{}',
    '{}',
    now(),
    now()
  );

insert into public.app_admins (user_id)
values ('00000000-0000-4000-8000-000000000001');

insert into public.players (
  id,
  name,
  nickname,
  seed,
  primary_position,
  secondary_positions
) values
  ('10000000-0000-4000-8000-000000000001', 'Test GK', null, 1, 'GK', '{}'),
  ('10000000-0000-4000-8000-000000000002', 'Test ST', 'Sát thủ', 3, 'ST', '{CM}');

select ok(
  private.valid_secondary_positions('CM', array['GK', 'CB', 'ST']),
  'three unique secondary positions are allowed'
);
select ok(
  not private.valid_secondary_positions('CM', array['GK', 'CB', 'LB', 'ST']),
  'four secondary positions are rejected'
);

insert into public.draw_sessions (
  id,
  title,
  match_date,
  team_count,
  status,
  created_by,
  algorithm_version,
  draw_seed,
  published_at
) values
  (
    '20000000-0000-4000-8000-000000000001',
    'Published fixture',
    current_date,
    3,
    'published',
    '00000000-0000-4000-8000-000000000001',
    'test-v1',
    'published-seed',
    now()
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    'Draft fixture',
    current_date,
    2,
    'draft',
    '00000000-0000-4000-8000-000000000001',
    'test-v1',
    'draft-seed',
    null
  );

insert into public.draw_assignments (
  session_id,
  player_id,
  team_index,
  reveal_order,
  player_name_snapshot,
  seed_snapshot,
  position_snapshot
) values
  (
    '20000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    0,
    0,
    'Test GK',
    1,
    'GK'
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000002',
    0,
    0,
    'Test ST',
    2,
    'ST'
  );

select is(
  (
    select player_name_snapshot
    from public.draw_assignments
    where session_id = '20000000-0000-4000-8000-000000000002'
  ),
  'Sát thủ',
  'assignment snapshot prefers nickname over player name'
);

select is(
  (select relrowsecurity from pg_class where oid = 'public.app_admins'::regclass),
  true,
  'RLS is enabled for app_admins'
);
select is(
  (select relrowsecurity from pg_class where oid = 'public.players'::regclass),
  true,
  'RLS is enabled for players'
);
select is(
  (select relrowsecurity from pg_class where oid = 'public.draw_sessions'::regclass),
  true,
  'RLS is enabled for draw_sessions'
);
select is(
  (select relrowsecurity from pg_class where oid = 'public.draw_assignments'::regclass),
  true,
  'RLS is enabled for draw_assignments'
);
select is(
  (select relrowsecurity from pg_class where oid = 'public.live_draw_state'::regclass),
  true,
  'RLS is enabled for live_draw_state'
);
select ok(
  exists (
    select 1
    from storage.buckets
    where id = 'player-avatars'
      and public
      and file_size_limit = 5242880
      and allowed_mime_types @> array['image/jpeg', 'image/png', 'image/webp']::text[]
  ),
  'player avatar bucket is public with image type and size restrictions'
);
select is(
  (
    select count(*)
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname like 'player_avatars_admin_%'
  ),
  3::bigint,
  'player avatar storage has admin-only select, insert and delete policies'
);

set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

select is((select count(*) from public.players), 2::bigint, 'anon can read players');
select throws_ok(
  $$insert into public.players (name, seed, primary_position) values ('Denied', 1, 'CM')$$,
  '42501',
  null,
  'anon cannot insert players'
);
select is(
  (select count(*) from public.draw_sessions),
  1::bigint,
  'anon only sees published sessions'
);
select is(
  (select count(*) from public.draw_assignments),
  1::bigint,
  'anon only sees published assignments'
);
select is((select count(*) from public.live_draw_state), 1::bigint, 'anon can read live draw state');
select throws_ok(
  $$update public.live_draw_state set state = '{"version":1}'::jsonb where id = 1$$,
  '42501',
  null,
  'anon cannot update live draw state'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-000000000002","role":"authenticated"}',
  true
);

select is(
  (select count(*) from public.draw_sessions),
  1::bigint,
  'authenticated non-admin only sees published sessions'
);
select throws_ok(
  $$insert into public.players (name, seed, primary_position) values ('Denied viewer', 1, 'CM')$$,
  '42501',
  null,
  'authenticated non-admin cannot insert players'
);
select is(
  (select count(*) from public.live_draw_state),
  1::bigint,
  'authenticated viewer can read live draw state'
);
select throws_ok(
  $$update public.live_draw_state set state = '{"version":1}'::jsonb where id = 1$$,
  '42501',
  null,
  'authenticated viewer cannot update live draw state'
);
select throws_ok(
  $$select public.publish_draw(
    'Denied publish',
    current_date,
    2::smallint,
    'test-v1',
    'denied-seed',
    '[
      {"player_id":"10000000-0000-4000-8000-000000000001","team_index":0,"reveal_order":0},
      {"player_id":"10000000-0000-4000-8000-000000000002","team_index":1,"reveal_order":1}
    ]'::jsonb
  )$$,
  '42501',
  null,
  'authenticated non-admin cannot publish'
);
select throws_ok(
  $$select public.delete_published_draw('20000000-0000-4000-8000-000000000001')$$,
  '42501',
  'Admin access required.',
  'authenticated non-admin cannot delete a published result'
);
select throws_ok(
  $$select public.set_published_draw_result(
    '20000000-0000-4000-8000-000000000001',
    null,
    array[0, 1, 2]::smallint[]
  )$$,
  '42501',
  'Admin access required.',
  'authenticated non-admin cannot set a post-match result'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);

select ok(public.is_admin(), 'allow-listed user is recognized as admin');
select is((select count(*) from public.draw_sessions), 2::bigint, 'admin can read drafts');
select lives_ok(
  $$insert into public.players (name, seed, primary_position) values ('Admin insert', 1, 'CM')$$,
  'admin can insert players'
);
select lives_ok(
  $$update public.players
    set avatar_path = '10000000-0000-4000-8000-000000000002/50000000-0000-4000-8000-000000000001.webp'
    where id = '10000000-0000-4000-8000-000000000002'$$,
  'admin can set a valid player avatar path'
);
select throws_ok(
  $$update public.players
    set avatar_path = '10000000-0000-4000-8000-000000000002/50000000-0000-4000-8000-000000000001.webp'
    where id = '10000000-0000-4000-8000-000000000001'$$,
  '23514',
  null,
  'avatar path must belong to the player folder'
);
select lives_ok(
  $$update public.live_draw_state
    set state = '{
      "version":1,
      "selectedPlayerIds":[],
      "teamCount":3,
      "preview":null,
      "wheel":{"status":"idle","revealedCount":0},
      "matchTitle":"Test live",
      "matchDate":"2026-11-15"
    }'::jsonb
    where id = 1$$,
  'admin can update live draw state'
);
select is(
  (select state ->> 'teamCount' from public.live_draw_state where id = 1),
  '3',
  'live draw state persists the admin team count'
);
select is(
  (select updated_by from public.live_draw_state where id = 1),
  '00000000-0000-4000-8000-000000000001'::uuid,
  'live draw state records the admin who updated it'
);
select throws_ok(
  $$insert into public.draw_sessions (
    title,
    match_date,
    team_count,
    status,
    created_by,
    algorithm_version,
    draw_seed,
    published_at
  ) values (
    'Direct published insert',
    current_date,
    2,
    'published',
    '00000000-0000-4000-8000-000000000001',
    'test-v1',
    'direct-seed',
    now()
  )$$,
  '42501',
  null,
  'admin cannot bypass the atomic publish RPC'
);
select throws_ok(
  $$select public.publish_draw(
    'Duplicate player publish',
    current_date,
    2::smallint,
    'test-v1',
    'duplicate-seed',
    '[
      {"player_id":"10000000-0000-4000-8000-000000000001","team_index":0,"reveal_order":0},
      {"player_id":"10000000-0000-4000-8000-000000000001","team_index":1,"reveal_order":1}
    ]'::jsonb
  )$$,
  '23505',
  'Each player must appear exactly once.',
  'publish RPC rejects duplicate players'
);
select is(
  (select count(*) from public.draw_sessions where status = 'published'),
  1::bigint,
  'failed publish leaves no partial session'
);
select lives_ok(
  $$select public.publish_draw(
    'Atomic published session',
    current_date,
    2::smallint,
    'test-v1',
    'atomic-seed',
    '[
      {"player_id":"10000000-0000-4000-8000-000000000001","team_index":0,"reveal_order":0,"is_starting":true},
      {"player_id":"10000000-0000-4000-8000-000000000002","team_index":1,"reveal_order":1,"is_starting":true}
    ]'::jsonb
  )$$,
  'admin can publish atomically'
);
select is(
  (select count(*) from public.draw_sessions where status = 'published'),
  2::bigint,
  'atomic publish created one complete published session'
);
select is(
  (
    select secondary_positions_snapshot
    from public.draw_assignments
    where player_id = '10000000-0000-4000-8000-000000000002'
      and session_id <> '20000000-0000-4000-8000-000000000002'
    order by id desc
    limit 1
  ),
  array['CM']::text[],
  'publish snapshots secondary positions for deterministic lineup placement'
);
select is(
  (
    select avatar_path_snapshot
    from public.draw_assignments
    where player_id = '10000000-0000-4000-8000-000000000002'
      and session_id <> '20000000-0000-4000-8000-000000000002'
    order by id desc
    limit 1
  ),
  '10000000-0000-4000-8000-000000000002/50000000-0000-4000-8000-000000000001.webp',
  'publish snapshots the player avatar path'
);
select lives_ok(
  $$select public.set_published_draw_result(
    '20000000-0000-4000-8000-000000000001',
    null,
    array[2, 0, 1]::smallint[]
  )$$,
  'admin can save a three-team ranking'
);
select is(
  (
    select team_rankings
    from public.draw_sessions
    where id = '20000000-0000-4000-8000-000000000001'
  ),
  array[2, 0, 1]::smallint[],
  'three-team ranking is stored in finishing order'
);
select throws_ok(
  $$select public.set_published_draw_result(
    '20000000-0000-4000-8000-000000000001',
    null,
    array[0, 0, 2]::smallint[]
  )$$,
  '22023',
  'A three-team result requires unique rankings for teams 0, 1 and 2.',
  'duplicate teams are rejected in a ranking'
);
select lives_ok(
  $$select public.set_published_draw_result(
    (select id from public.draw_sessions where title = 'Atomic published session'),
    array[3, 1]::smallint[],
    null
  )$$,
  'admin can save a two-team score'
);
select is(
  (
    select team_scores
    from public.draw_sessions
    where title = 'Atomic published session'
  ),
  array[3, 1]::smallint[],
  'two-team score is stored by team index'
);

reset role;
select throws_ok(
  $$update public.draw_sessions
    set title = 'Mutated history'
    where id = '20000000-0000-4000-8000-000000000001'$$,
  '55000',
  'Published draw sessions are immutable.',
  'published sessions are immutable even outside RLS'
);
select throws_ok(
  $$update public.draw_assignments
    set team_index = 1
    where session_id = '20000000-0000-4000-8000-000000000001'$$,
  '55000',
  'Assignments in a published session are immutable.',
  'published assignments are immutable even outside RLS'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);
select lives_ok(
  $$select public.delete_published_draw('20000000-0000-4000-8000-000000000001')$$,
  'admin can delete a published result through the guarded RPC'
);
select is(
  (
    select count(*)
    from public.draw_sessions
    where id = '20000000-0000-4000-8000-000000000001'
  ),
  0::bigint,
  'admin delete removes the published session'
);

select * from finish();
rollback;
