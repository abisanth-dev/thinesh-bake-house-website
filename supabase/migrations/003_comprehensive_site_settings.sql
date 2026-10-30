-- Comprehensive site configuration is stored as versionable JSON while the
-- legacy columns remain synchronized for backwards compatibility.
alter table public.general_settings
  add column if not exists config jsonb not null default '{}'::jsonb,
  add column if not exists private_config jsonb not null default '{}'::jsonb,
  add column if not exists updated_by uuid references auth.users(id) on delete set null;

comment on column public.general_settings.config is
  'Non-secret website configuration. Exposed only through a server-generated public-safe projection.';

comment on column public.general_settings.private_config is
  'Server-only configuration. Never return this column from public or admin frontend APIs.';

revoke all on table public.general_settings from anon, authenticated;
