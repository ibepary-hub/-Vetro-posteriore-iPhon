begin;

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

-- 1) Authorization helpers can obey RLS directly: no SECURITY DEFINER needed.
create or replace function public.beparytech_workspace_owner()
returns uuid
language sql
stable
security invoker
set search_path = ''
as $$
  select p.workspace_owner_id
  from public.beparytech_profiles p
  where p.user_id = (select auth.uid())
    and p.active = true
    and (select private.bt_license_active())
  limit 1
$$;

create or replace function public.beparytech_is_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists(
    select 1
    from public.beparytech_profiles p
    where p.user_id = (select auth.uid())
      and p.active = true
      and p.role = 'admin'
      and (select private.bt_license_active())
  )
$$;

-- Avoid recursive RLS when checking Super Admin; each user only needs to see their own marker row.
drop policy if exists "superadmins_read_self" on public.beparytech_super_admins;
create policy "superadmins_read_self" on public.beparytech_super_admins
for select to authenticated
using (user_id = (select auth.uid()));

create or replace function public.bt_is_super_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists(
    select 1
    from public.beparytech_super_admins s
    where s.user_id = (select auth.uid())
  )
$$;

revoke all on function public.beparytech_workspace_owner() from public, anon;
revoke all on function public.beparytech_is_admin() from public, anon;
revoke all on function public.bt_is_super_admin() from public, anon;
grant execute on function public.beparytech_workspace_owner() to authenticated;
grant execute on function public.beparytech_is_admin() to authenticated;
grant execute on function public.bt_is_super_admin() to authenticated;

-- 2) Give RLS enough permission for read-only RPCs, then make those RPCs SECURITY INVOKER.
drop policy if exists account_operators_self_select on public.beparytech_account_operators;
create policy account_operators_self_select on public.beparytech_account_operators
for select to authenticated
using (
  account_user_id = (select auth.uid())
  and workspace_owner_id = (select public.beparytech_workspace_owner())
);

drop policy if exists stores_workspace_member_select on public.beparytech_stores;
create policy stores_workspace_member_select on public.beparytech_stores
for select to authenticated
using (
  workspace_owner_id = (select public.beparytech_workspace_owner())
  and (
    ((active = true) and (admin_only = false))
    or (select public.beparytech_is_admin())
  )
);

create or replace function public.list_beparytech_account_operators()
returns table(id bigint, name text)
language sql
stable
security invoker
set search_path = ''
as $$
  select o.id,o.name
  from public.beparytech_account_operators o
  where o.account_user_id=(select auth.uid())
    and o.workspace_owner_id=(select public.beparytech_workspace_owner())
    and o.active=true
    and o.code_hash is not null
  order by o.name
$$;

create or replace function public.list_beparytech_stores()
returns table(id bigint, name text, admin_only boolean, active boolean)
language sql
stable
security invoker
set search_path = ''
as $$
  select s.id,s.name,s.admin_only,s.active
  from public.beparytech_stores s
  where s.workspace_owner_id=(select public.beparytech_workspace_owner())
    and ((select public.beparytech_is_admin()) or (s.active=true and s.admin_only=false))
  order by s.name
$$;

revoke all on function public.list_beparytech_account_operators() from public, anon;
revoke all on function public.list_beparytech_stores() from public, anon;
grant execute on function public.list_beparytech_account_operators() to authenticated;
grant execute on function public.list_beparytech_stores() to authenticated;

-- 3) Move privileged implementations out of the exposed public schema.
alter function public.adjust_beparytech_product_quantity(bigint,integer,text) set schema private;
alter function public.admin_list_beparytech_account_operators(uuid) set schema private;
alter function public.admin_set_beparytech_account_operator(uuid,text,text) set schema private;
alter function public.admin_set_beparytech_account_operator_active(bigint,boolean) set schema private;
alter function public.archive_beparytech_sale_v2(bigint,text,boolean) set schema private;
alter function public.create_beparytech_request(text,integer,text,text,text,text,text) set schema private;
alter function public.mark_beparytech_sale_delivered(bigint) set schema private;
alter function public.record_beparytech_product_sale_v107(bigint,integer,text,text,text,text) set schema private;
alter function public.record_beparytech_sale(text,text,text,text,text,text,text,text) set schema private;
alter function public.restore_beparytech_sale(bigint,text,text) set schema private;
alter function public.set_beparytech_inventory_quantity(text,text,text,integer) set schema private;
alter function public.update_beparytech_sale_customer(bigint,text) set schema private;
alter function public.update_beparytech_sale_note(bigint,text) set schema private;

-- Private implementations must not be callable anonymously. Authenticated can call them only through server/database code;
-- the private schema itself is not exposed by the project's Data API.
revoke all on function private.adjust_beparytech_product_quantity(bigint,integer,text) from public, anon;
revoke all on function private.admin_list_beparytech_account_operators(uuid) from public, anon;
revoke all on function private.admin_set_beparytech_account_operator(uuid,text,text) from public, anon;
revoke all on function private.admin_set_beparytech_account_operator_active(bigint,boolean) from public, anon;
revoke all on function private.archive_beparytech_sale_v2(bigint,text,boolean) from public, anon;
revoke all on function private.create_beparytech_request(text,integer,text,text,text,text,text) from public, anon;
revoke all on function private.mark_beparytech_sale_delivered(bigint) from public, anon;
revoke all on function private.record_beparytech_product_sale_v107(bigint,integer,text,text,text,text) from public, anon;
revoke all on function private.record_beparytech_sale(text,text,text,text,text,text,text,text) from public, anon;
revoke all on function private.restore_beparytech_sale(bigint,text,text) from public, anon;
revoke all on function private.set_beparytech_inventory_quantity(text,text,text,integer) from public, anon;
revoke all on function private.update_beparytech_sale_customer(bigint,text) from public, anon;
revoke all on function private.update_beparytech_sale_note(bigint,text) from public, anon;

grant execute on function private.adjust_beparytech_product_quantity(bigint,integer,text) to authenticated;
grant execute on function private.admin_list_beparytech_account_operators(uuid) to authenticated;
grant execute on function private.admin_set_beparytech_account_operator(uuid,text,text) to authenticated;
grant execute on function private.admin_set_beparytech_account_operator_active(bigint,boolean) to authenticated;
grant execute on function private.archive_beparytech_sale_v2(bigint,text,boolean) to authenticated;
grant execute on function private.create_beparytech_request(text,integer,text,text,text,text,text) to authenticated;
grant execute on function private.mark_beparytech_sale_delivered(bigint) to authenticated;
grant execute on function private.record_beparytech_product_sale_v107(bigint,integer,text,text,text,text) to authenticated;
grant execute on function private.record_beparytech_sale(text,text,text,text,text,text,text,text) to authenticated;
grant execute on function private.restore_beparytech_sale(bigint,text,text) to authenticated;
grant execute on function private.set_beparytech_inventory_quantity(text,text,text,integer) to authenticated;
grant execute on function private.update_beparytech_sale_customer(bigint,text) to authenticated;
grant execute on function private.update_beparytech_sale_note(bigint,text) to authenticated;

-- 4) Public API wrappers are SECURITY INVOKER and keep the exact RPC names/signatures used by the app.
create function public.adjust_beparytech_product_quantity(p_product_id bigint, p_new_quantity integer, p_reason text default null)
returns integer language sql security invoker set search_path=''
as $$ select private.adjust_beparytech_product_quantity(p_product_id,p_new_quantity,p_reason) $$;

create function public.admin_list_beparytech_account_operators(p_account_user_id uuid)
returns table(id bigint, name text, active boolean, code_set boolean)
language sql security invoker set search_path=''
as $$ select * from private.admin_list_beparytech_account_operators(p_account_user_id) $$;

create function public.admin_set_beparytech_account_operator(p_account_user_id uuid, p_name text, p_code text)
returns bigint language sql security invoker set search_path=''
as $$ select private.admin_set_beparytech_account_operator(p_account_user_id,p_name,p_code) $$;

create function public.admin_set_beparytech_account_operator_active(p_operator_id bigint, p_active boolean)
returns void language sql security invoker set search_path=''
as $$ select private.admin_set_beparytech_account_operator_active(p_operator_id,p_active) $$;

create function public.archive_beparytech_sale_v2(p_id bigint, p_reason text, p_restore_inventory boolean default false)
returns void language sql security invoker set search_path=''
as $$ select private.archive_beparytech_sale_v2(p_id,p_reason,p_restore_inventory) $$;

create function public.create_beparytech_request(
  p_item text,
  p_quantity integer,
  p_note text default null,
  p_code text default null,
  p_link text default null,
  p_operator_name text default null,
  p_operator_code text default null
)
returns bigint language sql security invoker set search_path=''
as $$ select private.create_beparytech_request(p_item,p_quantity,p_note,p_code,p_link,p_operator_name,p_operator_code) $$;

create function public.mark_beparytech_sale_delivered(p_id bigint)
returns void language sql security invoker set search_path=''
as $$ select private.mark_beparytech_sale_delivered(p_id) $$;

create function public.record_beparytech_product_sale_v107(
  p_product_id bigint,
  p_quantity integer,
  p_customer text,
  p_operator_name text,
  p_operator_password text,
  p_note text default null
)
returns integer language sql security invoker set search_path=''
as $$ select private.record_beparytech_product_sale_v107(p_product_id,p_quantity,p_customer,p_operator_name,p_operator_password,p_note) $$;

create function public.record_beparytech_sale(
  p_customer text,
  p_category text,
  p_item_key text,
  p_model text,
  p_color text,
  p_operator_name text,
  p_operator_password text,
  p_note text default null
)
returns integer language sql security invoker set search_path=''
as $$ select private.record_beparytech_sale(p_customer,p_category,p_item_key,p_model,p_color,p_operator_name,p_operator_password,p_note) $$;

create function public.restore_beparytech_sale(p_id bigint, p_reason text, p_operator_password text)
returns integer language sql security invoker set search_path=''
as $$ select private.restore_beparytech_sale(p_id,p_reason,p_operator_password) $$;

create function public.set_beparytech_inventory_quantity(p_item_key text, p_model text, p_color text, p_quantity integer)
returns integer language sql security invoker set search_path=''
as $$ select private.set_beparytech_inventory_quantity(p_item_key,p_model,p_color,p_quantity) $$;

create function public.update_beparytech_sale_customer(p_id bigint, p_customer text)
returns void language sql security invoker set search_path=''
as $$ select private.update_beparytech_sale_customer(p_id,p_customer) $$;

create function public.update_beparytech_sale_note(p_id bigint, p_note text)
returns void language sql security invoker set search_path=''
as $$ select private.update_beparytech_sale_note(p_id,p_note) $$;

-- Explicit API grants; PUBLIC/anon cannot execute these RPCs.
revoke all on function public.adjust_beparytech_product_quantity(bigint,integer,text) from public, anon;
revoke all on function public.admin_list_beparytech_account_operators(uuid) from public, anon;
revoke all on function public.admin_set_beparytech_account_operator(uuid,text,text) from public, anon;
revoke all on function public.admin_set_beparytech_account_operator_active(bigint,boolean) from public, anon;
revoke all on function public.archive_beparytech_sale_v2(bigint,text,boolean) from public, anon;
revoke all on function public.create_beparytech_request(text,integer,text,text,text,text,text) from public, anon;
revoke all on function public.mark_beparytech_sale_delivered(bigint) from public, anon;
revoke all on function public.record_beparytech_product_sale_v107(bigint,integer,text,text,text,text) from public, anon;
revoke all on function public.record_beparytech_sale(text,text,text,text,text,text,text,text) from public, anon;
revoke all on function public.restore_beparytech_sale(bigint,text,text) from public, anon;
revoke all on function public.set_beparytech_inventory_quantity(text,text,text,integer) from public, anon;
revoke all on function public.update_beparytech_sale_customer(bigint,text) from public, anon;
revoke all on function public.update_beparytech_sale_note(bigint,text) from public, anon;

grant execute on function public.adjust_beparytech_product_quantity(bigint,integer,text) to authenticated;
grant execute on function public.admin_list_beparytech_account_operators(uuid) to authenticated;
grant execute on function public.admin_set_beparytech_account_operator(uuid,text,text) to authenticated;
grant execute on function public.admin_set_beparytech_account_operator_active(bigint,boolean) to authenticated;
grant execute on function public.archive_beparytech_sale_v2(bigint,text,boolean) to authenticated;
grant execute on function public.create_beparytech_request(text,integer,text,text,text,text,text) to authenticated;
grant execute on function public.mark_beparytech_sale_delivered(bigint) to authenticated;
grant execute on function public.record_beparytech_product_sale_v107(bigint,integer,text,text,text,text) to authenticated;
grant execute on function public.record_beparytech_sale(text,text,text,text,text,text,text,text) to authenticated;
grant execute on function public.restore_beparytech_sale(bigint,text,text) to authenticated;
grant execute on function public.set_beparytech_inventory_quantity(text,text,text,integer) to authenticated;
grant execute on function public.update_beparytech_sale_customer(bigint,text) to authenticated;
grant execute on function public.update_beparytech_sale_note(bigint,text) to authenticated;

-- 5) Legacy/internal SECURITY DEFINER functions are not part of the browser API.
revoke all on function public.beparytech_resolve_operator_name(text,text) from public, anon, authenticated;
revoke all on function public.record_beparytech_product_sale(bigint,text,text,text,text) from public, anon, authenticated;
revoke all on function public.set_beparytech_operator_password(uuid,text) from public, anon, authenticated;

commit;

-- Required grants for the SECURITY INVOKER read RPCs.
revoke all on table public.beparytech_account_operators from anon;
revoke all on table public.beparytech_stores from anon;
grant select on table public.beparytech_account_operators to authenticated;
grant select on table public.beparytech_stores to authenticated;
