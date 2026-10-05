-- BeparyTech Manager · Server-side SaaS license enforcement
-- Eseguire DOPO SETUP_SAAS_SUPABASE.sql su installazioni nuove.
-- Sul progetto BeparyTech principale questa protezione è già stata applicata il 05/10/2026.

begin;

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.bt_license_active()
returns boolean language sql stable security invoker set search_path = '' as $$
  select case
    when (select auth.uid()) is null then false
    when exists (select 1 from public.beparytech_super_admins s where s.user_id=(select auth.uid())) then true
    else exists (
      select 1 from public.beparytech_companies c
      where c.workspace_owner_id=(
        select p.workspace_owner_id from public.beparytech_profiles p
        where p.user_id=(select auth.uid()) and p.active=true limit 1
      )
      and c.status in ('active','trial')
      and (c.expires_at is null or c.expires_at >= current_date)
    )
  end
$$;

create or replace function private.bt_module_allowed(p_module text)
returns boolean language sql stable security invoker set search_path = '' as $$
  select case
    when (select auth.uid()) is null then false
    when exists (select 1 from public.beparytech_super_admins s where s.user_id=(select auth.uid())) then true
    else exists (
      select 1 from public.beparytech_companies c
      where c.workspace_owner_id=(
        select p.workspace_owner_id from public.beparytech_profiles p
        where p.user_id=(select auth.uid()) and p.active=true limit 1
      )
      and c.status in ('active','trial')
      and (c.expires_at is null or c.expires_at >= current_date)
      and (c.plan='owner' or c.modules ? p_module)
    )
  end
$$;

revoke all on function private.bt_license_active() from public, anon;
revoke all on function private.bt_module_allowed(text) from public, anon;
grant execute on function private.bt_license_active() to authenticated;
grant execute on function private.bt_module_allowed(text) to authenticated;

create or replace function private.bt_enforce_write_license()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_module text := tg_argv[0];
begin
  -- Permette migrazioni/SQL amministrativo senza JWT utente finale.
  if (select auth.uid()) is null then return coalesce(new,old); end if;
  if v_module='__active__' then
    if not (select private.bt_license_active()) then
      raise exception 'Licenza BeparyTech non attiva' using errcode='42501';
    end if;
  elsif not (select private.bt_module_allowed(v_module)) then
    raise exception 'Modulo BeparyTech non abilitato: %',v_module using errcode='42501';
  end if;
  return coalesce(new,old);
end $$;
revoke all on function private.bt_enforce_write_license() from public, anon, authenticated;

-- Se la licenza è sospesa/scaduta, anche le vecchie RPC che usano queste helper falliscono chiuse.
create or replace function public.beparytech_workspace_owner()
returns uuid language sql stable security invoker set search_path = '' as $$
  select p.workspace_owner_id from public.beparytech_profiles p
  where p.user_id=(select auth.uid()) and p.active=true
    and (select private.bt_license_active())
  limit 1
$$;

create or replace function public.beparytech_is_admin()
returns boolean language sql stable security invoker set search_path = '' as $$
  select exists(
    select 1 from public.beparytech_profiles p
    where p.user_id=(select auth.uid()) and p.active=true and p.role='admin'
      and (select private.bt_license_active())
  )
$$;

revoke all on function public.beparytech_workspace_owner() from public, anon;
revoke all on function public.beparytech_is_admin() from public, anon;
grant execute on function public.beparytech_workspace_owner() to authenticated;
grant execute on function public.beparytech_is_admin() to authenticated;

-- RLS restrittiva per modulo. È in AND con le policy workspace/ruolo già esistenti.
do $plpgsql$
declare r record;
begin
  for r in select * from (values
    ('backglass_inventory','inventory'),
    ('backglass_inventory_history','inventory'),
    ('beparytech_sections','inventory'),
    ('beparytech_products','inventory'),
    ('beparytech_requests','inventory'),
    ('beparytech_product_costs','inventory'),
    ('beparytech_supplier_quotes','inventory'),
    ('beparytech_sales','sales'),
    ('beparytech_sale_prices','sales'),
    ('beparytech_admin_device_sales','sales'),
    ('beparytech_admin_repairs','repairs'),
    ('beparytech_work_ddts','ddt'),
    ('beparytech_work_ddt_items','ddt'),
    ('beparytech_work_hours','hours'),
    ('beparytech_work_extras','hours'),
    ('beparytech_bestek_catalog','bestek')
  ) as x(tablename,module)
  loop
    execute format('drop policy if exists license_module_gate on public.%I',r.tablename);
    execute format(
      'create policy license_module_gate on public.%I as restrictive for all to authenticated using ((select private.bt_module_allowed(%L))) with check ((select private.bt_module_allowed(%L)))',
      r.tablename,r.module,r.module
    );
  end loop;
end $plpgsql$;

-- Trigger sulle scritture: protegge anche le RPC SECURITY DEFINER che bypassano RLS.
do $plpgsql$
declare r record;
begin
  for r in select * from (values
    ('backglass_inventory','inventory'),
    ('beparytech_sections','inventory'),
    ('beparytech_products','inventory'),
    ('beparytech_requests','inventory'),
    ('beparytech_product_costs','inventory'),
    ('beparytech_supplier_quotes','inventory'),
    ('beparytech_sales','sales'),
    ('beparytech_sale_prices','sales'),
    ('beparytech_admin_device_sales','sales'),
    ('beparytech_admin_repairs','repairs'),
    ('beparytech_work_ddts','ddt'),
    ('beparytech_work_ddt_items','ddt'),
    ('beparytech_work_hours','hours'),
    ('beparytech_work_extras','hours'),
    ('beparytech_bestek_catalog','bestek'),
    ('beparytech_account_operators','__active__')
  ) as x(tablename,module)
  loop
    execute format('drop trigger if exists bt_license_write_gate on public.%I',r.tablename);
    execute format(
      'create trigger bt_license_write_gate before insert or update or delete on public.%I for each row execute function private.bt_enforce_write_license(%L)',
      r.tablename,r.module
    );
  end loop;
end $plpgsql$;

commit;
