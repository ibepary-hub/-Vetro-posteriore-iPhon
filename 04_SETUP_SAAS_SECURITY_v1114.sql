-- BeparyTech v1114 - Security hardening finale
-- Sicuro da rieseguire sopra v1112/v1114.

begin;

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

-- Se la vecchia funzione password operatore e' ancora SECURITY DEFINER nel public,
-- spostala nel private. Se e' gia' stata spostata, non fare nulla.
do $$
declare v_definer boolean;
begin
  select p.prosecdef into v_definer
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='set_beparytech_operator_password'
    and pg_get_function_identity_arguments(p.oid)='p_target_user_id uuid, p_password text';
  if coalesce(v_definer,false)
     and to_regprocedure('private.set_beparytech_operator_password(uuid,text)') is null then
    execute 'alter function public.set_beparytech_operator_password(uuid,text) set schema private';
  end if;
end $$;

revoke all on function private.set_beparytech_operator_password(uuid,text) from public, anon;
grant execute on function private.set_beparytech_operator_password(uuid,text) to authenticated;

create or replace function public.set_beparytech_operator_password(p_target_user_id uuid, p_password text)
returns void
language sql
security invoker
set search_path = ''
as $$ select private.set_beparytech_operator_password(p_target_user_id,p_password) $$;
revoke all on function public.set_beparytech_operator_password(uuid,text) from public, anon;
grant execute on function public.set_beparytech_operator_password(uuid,text) to authenticated;

create or replace function private.bt_enforce_company_user_limit()
returns trigger language plpgsql security definer set search_path=''
as $$
declare c public.beparytech_companies%rowtype; n integer;
begin
  if coalesce(new.active,true) is false then return new; end if;
  select * into c from public.beparytech_companies where workspace_owner_id=new.workspace_owner_id;
  if not found then raise exception 'Workspace senza licenza BeparyTech' using errcode='42501'; end if;
  if c.plan='owner' then return new; end if;
  if c.status not in ('active','trial') or (c.expires_at is not null and c.expires_at<current_date)
    then raise exception 'Licenza BeparyTech non attiva' using errcode='42501'; end if;
  select count(*) into n from public.beparytech_profiles p
   where p.workspace_owner_id=new.workspace_owner_id and p.active=true
     and (tg_op='INSERT' or p.user_id<>new.user_id);
  if n>=c.max_users then raise exception 'Limite utenti del piano raggiunto (%).',c.max_users using errcode='42501'; end if;
  return new;
end $$;

drop trigger if exists bt_company_user_limit on public.beparytech_profiles;
create trigger bt_company_user_limit
before insert or update of active,workspace_owner_id on public.beparytech_profiles
for each row execute function private.bt_enforce_company_user_limit();

create or replace function private.bt_enforce_company_store_limit()
returns trigger language plpgsql security definer set search_path=''
as $$
declare c public.beparytech_companies%rowtype; n integer;
begin
  if coalesce(new.active,true) is false then return new; end if;
  select * into c from public.beparytech_companies where workspace_owner_id=new.workspace_owner_id;
  if not found then raise exception 'Workspace senza licenza BeparyTech' using errcode='42501'; end if;
  if c.plan='owner' then return new; end if;
  if c.status not in ('active','trial') or (c.expires_at is not null and c.expires_at<current_date)
    then raise exception 'Licenza BeparyTech non attiva' using errcode='42501'; end if;
  select count(*) into n from public.beparytech_stores s
   where s.workspace_owner_id=new.workspace_owner_id and s.active=true
     and (tg_op='INSERT' or s.id<>new.id);
  if n>=c.max_stores then raise exception 'Limite negozi del piano raggiunto (%).',c.max_stores using errcode='42501'; end if;
  return new;
end $$;

drop trigger if exists bt_company_store_limit on public.beparytech_stores;
create trigger bt_company_store_limit
before insert or update of active,workspace_owner_id on public.beparytech_stores
for each row execute function private.bt_enforce_company_store_limit();

drop policy if exists license_active_gate on public.beparytech_profiles;
create policy license_active_gate on public.beparytech_profiles
as restrictive for select to authenticated
using ((select private.bt_license_active()));

drop policy if exists repair_intake_license_module_gate on storage.objects;
create policy repair_intake_license_module_gate on storage.objects
as restrictive for all to authenticated
using (
  bucket_id <> 'repair-intake' or (
    (select private.bt_license_active()) and
    case
      when (storage.foldername(name))[2]='products' then (select private.bt_module_allowed('inventory'))
      when (storage.foldername(name))[2]='ddt' then (select private.bt_module_allowed('ddt'))
      else (select private.bt_module_allowed('repairs'))
    end
  )
)
with check (
  bucket_id <> 'repair-intake' or (
    (select private.bt_license_active()) and
    case
      when (storage.foldername(name))[2]='products' then (select private.bt_module_allowed('inventory'))
      when (storage.foldername(name))[2]='ddt' then (select private.bt_module_allowed('ddt'))
      else (select private.bt_module_allowed('repairs'))
    end
  )
);

commit;


-- v1114 · isolamento multi-tenant Catalogo Bestek
begin;
alter table public.beparytech_bestek_catalog add column if not exists workspace_owner_id uuid;
update public.beparytech_bestek_catalog
set workspace_owner_id = coalesce(
  (select c.workspace_owner_id from public.beparytech_companies c where c.plan='owner' order by c.created_at limit 1),
  (select p.workspace_owner_id from public.beparytech_profiles p where p.role='admin' and p.user_id=p.workspace_owner_id order by p.created_at limit 1)
)
where workspace_owner_id is null;
do $$ begin
  if exists(select 1 from public.beparytech_bestek_catalog where workspace_owner_id is null) then
    raise exception 'Impossibile determinare il workspace owner per il catalogo Bestek. Crea prima la licenza Owner.';
  end if;
end $$;
alter table public.beparytech_bestek_catalog
  alter column workspace_owner_id set default public.beparytech_workspace_owner(),
  alter column workspace_owner_id set not null;
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conrelid='public.beparytech_bestek_catalog'::regclass
      and contype='p' and conname='beparytech_bestek_catalog_pkey'
  ) then
    alter table public.beparytech_bestek_catalog drop constraint beparytech_bestek_catalog_pkey;
  end if;
end $$;
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid='public.beparytech_bestek_catalog'::regclass
      and contype='p'
  ) then
    alter table public.beparytech_bestek_catalog
      add constraint beparytech_bestek_catalog_pkey primary key (workspace_owner_id,code);
  end if;
end $$;
create index if not exists beparytech_bestek_catalog_code_idx on public.beparytech_bestek_catalog(code);
drop policy if exists bestek_catalog_admin_select on public.beparytech_bestek_catalog;
drop policy if exists bestek_catalog_admin_insert on public.beparytech_bestek_catalog;
drop policy if exists bestek_catalog_admin_update on public.beparytech_bestek_catalog;
drop policy if exists bestek_catalog_admin_delete on public.beparytech_bestek_catalog;
create policy bestek_catalog_admin_select on public.beparytech_bestek_catalog for select to authenticated
using (workspace_owner_id=(select public.beparytech_workspace_owner()) and (select public.beparytech_is_admin()) and (select private.bt_module_allowed('bestek')));
create policy bestek_catalog_admin_insert on public.beparytech_bestek_catalog for insert to authenticated
with check (workspace_owner_id=(select public.beparytech_workspace_owner()) and (select public.beparytech_is_admin()) and (select private.bt_module_allowed('bestek')));
create policy bestek_catalog_admin_update on public.beparytech_bestek_catalog for update to authenticated
using (workspace_owner_id=(select public.beparytech_workspace_owner()) and (select public.beparytech_is_admin()) and (select private.bt_module_allowed('bestek')))
with check (workspace_owner_id=(select public.beparytech_workspace_owner()) and (select public.beparytech_is_admin()) and (select private.bt_module_allowed('bestek')));
create policy bestek_catalog_admin_delete on public.beparytech_bestek_catalog for delete to authenticated
using (workspace_owner_id=(select public.beparytech_workspace_owner()) and (select public.beparytech_is_admin()) and (select private.bt_module_allowed('bestek')));
commit;
