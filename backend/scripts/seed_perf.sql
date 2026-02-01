-- Performance seed for PostgreSQL
-- Generates: 5000 users, ~pods with 10-20 members, 500 virtual teams,
-- favorites per user, and leaves per user.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Clean existing data (order matters if FK constraints exist)
TRUNCATE TABLE favorite_teams, view_history, leaves, team_members, teams, pod_members, pods, users RESTART IDENTITY CASCADE;

DO $$
DECLARE
  user_count int := 5000;
  pod_size_min int := 10;
  pod_size_max int := 20;
  team_count int := 500;
  team_size_min int := 10;
  team_size_max int := 20;
  favorites_per_user int := 3;
  leaves_per_user int := 3;
  base_date date := DATE '2026-01-01';

  u int := 1;
  p int := 1;
  pod_size int;
  pod_id text;
BEGIN
  -- Create pods and assign users (10-20 per pod)
  WHILE u <= user_count LOOP
    pod_id := format('pod%04s', p);
    INSERT INTO pods (id, name) VALUES (pod_id, format('Pod %s', p));

    pod_size := floor(random() * (pod_size_max - pod_size_min + 1))::int + pod_size_min;
    FOR i IN 1..pod_size LOOP
      EXIT WHEN u > user_count;
      INSERT INTO users (
        id, employee_id, display_name, email, country, avatar, team_id, ad_principal_id
      ) VALUES (
        format('u%05s', u),
        format('E%05s', u),
        format('User %s', u),
        format('user%05s@company.com', u),
        CASE WHEN (u % 2) = 0 THEN 'US' ELSE 'CN' END,
        format('https://picsum.photos/seed/u%s/200', u),
        pod_id,
        NULL
      );

      INSERT INTO pod_members (pod_id, user_id)
      VALUES (pod_id, format('u%05s', u));

      u := u + 1;
    END LOOP;

    p := p + 1;
  END LOOP;

  -- Create 500 virtual teams
  INSERT INTO teams (id, name, type, created_by)
  SELECT
    format('vt%04s', t),
    format('Virtual Team %s', t),
    'VIRTUAL',
    format('u%05s', (floor(random() * user_count) + 1)::int)
  FROM generate_series(1, team_count) AS t;

  -- Team members: 10-20 random users per team
  INSERT INTO team_members (team_id, user_id)
  SELECT DISTINCT
    t.id,
    format('u%05s', (floor(random() * user_count) + 1)::int)
  FROM teams t
  CROSS JOIN LATERAL generate_series(
    1,
    (floor(random() * (team_size_max - team_size_min + 1)) + team_size_min)::int
  ) AS g;

  -- Favorites: each user favorites a few teams
  INSERT INTO favorite_teams (id, user_id, team_id, created_at)
  SELECT
    gen_random_uuid()::text,
    u.id,
    t.id,
    (extract(epoch from now()) * 1000)::bigint
  FROM users u
  CROSS JOIN LATERAL (
    SELECT id FROM teams ORDER BY random() LIMIT favorites_per_user
  ) t;

  -- Leaves: a few per user
  INSERT INTO leaves (id, user_id, start_date, end_date, source, status, note)
  SELECT
    gen_random_uuid()::text,
    u.id,
    base_date + (floor(random() * 330))::int,
    base_date + (floor(random() * 330) + floor(random() * 10))::int,
    (ARRAY['HR','OUTLOOK','MANUAL'])[floor(random() * 3)::int + 1],
    (ARRAY['APPROVED','PENDING','REJECTED'])[floor(random() * 3)::int + 1],
    'Seeded leave'
  FROM users u
  CROSS JOIN generate_series(1, leaves_per_user) AS g;
END $$;
