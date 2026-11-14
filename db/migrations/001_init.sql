-- Mainstream: requests inbox, admin accounts, and site content.

create table users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null,
  role text not null check (role in ('owner', 'agent', 'editor')),
  password_hash text not null,
  totp_secret text,
  totp_enabled boolean not null default false,
  totp_last_step bigint not null default 0,
  active boolean not null default true,
  failed_logins int not null default 0,
  locked_until timestamptz,
  created_at timestamptz not null default now()
);

create table sessions (
  token_hash text primary key,
  user_id uuid not null references users (id) on delete cascade,
  mfa_ok boolean not null default false,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index sessions_user_idx on sessions (user_id);

create table requests (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique,
  idem_key uuid not null unique,
  type text not null check (type in ('meeting', 'quote', 'inquiry', 'partner')),
  status text not null default 'new',
  name text not null,
  phone text,
  email text,
  business text,
  sector text,
  services text[] not null default '{}',
  meeting_type text,
  meeting_day date,
  meeting_time text,
  subject text,
  message text,
  source text,
  assignee_id uuid references users (id) on delete set null,
  notify_status text not null default 'pending' check (notify_status in ('pending', 'sent', 'failed')),
  notify_error text,
  notify_attempts int not null default 0,
  ip_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz,
  check (phone is not null or email is not null)
);
create index requests_created_idx on requests (created_at desc);
create index requests_status_idx on requests (status);

create table request_notes (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references requests (id) on delete cascade,
  author_id uuid references users (id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);
create index request_notes_request_idx on request_notes (request_id);

-- Who changed what and when: request statuses, assignments, permissions, content publishing.
create table audit_log (
  id bigserial primary key,
  actor_id uuid references users (id) on delete set null,
  actor_name text,
  action text not null,
  entity text not null,
  entity_id text,
  meta jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index audit_entity_idx on audit_log (entity, entity_id);
create index audit_created_idx on audit_log (created_at desc);

create table rate_limits (
  key text not null,
  bucket timestamptz not null,
  count int not null default 1,
  primary key (key, bucket)
);

-- Anonymous funnel events (saved request, WhatsApp click). Never holds customer data.
create table events (
  id bigserial primary key,
  name text not null,
  request_type text,
  service text,
  source text,
  created_at timestamptz not null default now()
);
create index events_created_idx on events (created_at desc);

create table services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  code text not null,
  title text not null,
  line text not null,
  items text[] not null default '{}',
  summary text not null default '',
  body text not null default '',
  seo_title text,
  seo_description text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  position int not null default 0,
  updated_at timestamptz not null default now()
);

create table works (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  category text not null default '',
  client text,
  summary text not null default '',
  body text not null default '',
  service_slug text,
  cover text,
  media jsonb not null default '[]',
  status text not null default 'draft' check (status in ('draft', 'published')),
  position int not null default 0,
  updated_at timestamptz not null default now()
);

create table faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  position int not null default 0,
  updated_at timestamptz not null default now()
);

create table media (
  id uuid primary key default gen_random_uuid(),
  path text not null unique,
  kind text not null check (kind in ('image', 'video')),
  width int,
  height int,
  bytes int not null,
  uploaded_by uuid references users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
