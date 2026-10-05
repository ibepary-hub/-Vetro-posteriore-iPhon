-- BeparyTech v1115 - third security audit hardening
-- Run AFTER 01, 02, 03 and 04.
begin;

-- 1) Enforce tenant consistency on cross-table references.
create or replace function private.bt_enforce_tenant_relations()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_table_name = 'beparytech_products' then
    if not exists (
      select 1 from public.beparytech_sections s
      where s.id = new.section_id
        and s.workspace_owner_id = new.workspace_owner_id
    ) then
      raise exception 'Sezione non appartenente al workspace corrente' using errcode='23503';
    end if;

  elsif tg_table_name = 'beparytech_sale_note_history' then
    if not exists (
      select 1 from public.beparytech_sales s
      where s.id = new.sale_id
        and s.user_id = new.workspace_owner_id
    ) then
      raise exception 'Vendita non appartenente al workspace corrente' using errcode='23503';
    end if;

  elsif tg_table_name = 'beparytech_work_ddt_items' then
    if not exists (
      select 1 from public.beparytech_work_ddts d
      where d.id = new.ddt_id
        and d.workspace_owner_id = new.workspace_owner_id
    ) then
      raise exception 'DDT non appartenente al workspace corrente' using errcode='23503';
    end if;

    if new.repair_id is not null and not exists (
      select 1 from public.beparytech_admin_repairs r
      where r.id = new.repair_id
        and r.workspace_owner_id = new.workspace_owner_id
    ) then
      raise exception 'Riparazione non appartenente al workspace corrente' using errcode='23503';
    end if;
  end if;

  return new;
end
$$;

revoke all on function private.bt_enforce_tenant_relations() from public, anon, authenticated;

drop trigger if exists bt_tenant_relation_guard on public.beparytech_products;
create trigger bt_tenant_relation_guard
before insert or update of workspace_owner_id,section_id on public.beparytech_products
for each row execute function private.bt_enforce_tenant_relations();

drop trigger if exists bt_tenant_relation_guard on public.beparytech_sale_note_history;
create trigger bt_tenant_relation_guard
before insert or update of workspace_owner_id,sale_id on public.beparytech_sale_note_history
for each row execute function private.bt_enforce_tenant_relations();

drop trigger if exists bt_tenant_relation_guard on public.beparytech_work_ddt_items;
create trigger bt_tenant_relation_guard
before insert or update of workspace_owner_id,ddt_id,repair_id on public.beparytech_work_ddt_items
for each row execute function private.bt_enforce_tenant_relations();

-- 2) Never expose password/code hashes to browser clients.
revoke select on table public.beparytech_profiles from authenticated;
grant select (user_id,username,role,active,workspace_owner_id,created_at)
  on public.beparytech_profiles to authenticated;

revoke select on table public.beparytech_account_operators from authenticated;
grant select (id,workspace_owner_id,account_user_id,name,active,created_by,created_at,updated_at)
  on public.beparytech_account_operators to authenticated;

-- 3) Match Storage limits/types to the actual UI: photos + inbound/outbound DDT.
update storage.buckets
set file_size_limit = 10485760,
    allowed_mime_types = array[
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/heic',
      'image/heif'
    ]::text[]
where id='repair-intake';

commit;
