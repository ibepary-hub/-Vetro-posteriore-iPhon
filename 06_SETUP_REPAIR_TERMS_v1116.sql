-- BeparyTech v1116 · Data presunta ritiro + presa visione condizioni/privacy
begin;

alter table public.beparytech_admin_repairs
  add column if not exists estimated_pickup_date date,
  add column if not exists intake_terms_accepted_at timestamptz,
  add column if not exists intake_terms_version text,
  add column if not exists privacy_notice_version text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname='beparytech_admin_repairs_pickup_date_check'
      and conrelid='public.beparytech_admin_repairs'::regclass
  ) then
    alter table public.beparytech_admin_repairs
      add constraint beparytech_admin_repairs_pickup_date_check
      check (estimated_pickup_date is null or estimated_pickup_date >= repaired_at);
  end if;
end $$;

commit;
