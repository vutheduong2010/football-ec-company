begin;

create extension if not exists pgtap with schema extensions;
select plan(28);

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
