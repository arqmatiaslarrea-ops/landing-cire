-- Tanda 2 de la auditoría (23/11)

-- I6: la automatización se gana por paso revisado, no por clics.
-- Una tanda cuenta solo si la aprueba un admin y tiene al menos 3 mails; cada paso tiene que haber sido revisado
-- al menos una vez antes de salir solo.
alter table crm_secuencias add column if not exists pasos_revisados int[] not null default '{}';
update crm_secuencias set tandas_aprobadas = 0 where id = 'vendedores'; -- la de hoy fue una prueba de 1 mail

create or replace function crm_aprobar_tanda(p_secuencia text, p_ids uuid[])
returns jsonb language plpgsql security definer set search_path = public as $$
declare n int; pasos int[]; cuenta boolean;
begin
  if not crm_es_admin() then raise exception 'Solo un admin aprueba tandas'; end if;
  update crm_envios e set estado = 'aprobado'
    from crm_inscripciones i
   where e.id = any(p_ids) and e.estado = 'pendiente_aprobacion' and i.id = e.inscripcion_id and i.secuencia_id = p_secuencia;
  get diagnostics n = row_count;
  select array_agg(distinct paso) into pasos from crm_envios where id = any(p_ids) and estado = 'aprobado';
  cuenta := n >= 3;
  update crm_secuencias
     set pasos_revisados = (select array(select distinct unnest(pasos_revisados || coalesce(pasos, '{}')) order by 1)),
         tandas_aprobadas = tandas_aprobadas + case when cuenta then 1 else 0 end
   where id = p_secuencia;
  return jsonb_build_object('aprobados', n, 'cuenta', cuenta);
end $$;
revoke execute on function crm_aprobar_tanda(text, uuid[]) from anon, public;
grant execute on function crm_aprobar_tanda(text, uuid[]) to authenticated;

-- I17: "Tomarlos yo" por alcance, con registro fila por fila para poder deshacer.
create table if not exists crm_reasignaciones (
  id bigserial primary key,
  lote uuid not null,
  tabla text not null check (tabla in ('crm_tareas', 'crm_relations')),
  fila uuid not null,
  de text not null,
  a text not null,
  por text,
  revertida_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists ix_reasig_lote on crm_reasignaciones (lote);
alter table crm_reasignaciones enable row level security;
create policy reasig_admin_lee on crm_reasignaciones for select to authenticated using (crm_es_admin());

drop function if exists crm_reasignar(text, text);
-- p_alcance: 'vencidas' (solo tareas vencidas), 'calientes' (las p_cantidad oportunidades más calientes y sus tareas), 'todo'
create or replace function crm_reasignar(p_de text, p_a text, p_alcance text default 'todo', p_cantidad int default 10)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_lote uuid := gen_random_uuid(); v_por text; t int := 0; r int := 0;
begin
  if not crm_es_admin() then raise exception 'Solo un admin reasigna cartera'; end if;
  if not exists (select 1 from crm_usuarios where clave = p_a and activo) then raise exception 'El destino no es un usuario activo'; end if;
  select clave into v_por from crm_usuarios where lower(email) = lower(auth.jwt()->>'email');

  drop table if exists _rels;
  create temp table _rels on commit drop as
    select id, contact_id from crm_relations
     where responsable = p_de and estado <> 'descartado' and etapa in ('nuevo','contactado','descubrimiento')
       and p_alcance in ('todo', 'calientes');
  if p_alcance = 'calientes' then
    delete from _rels where id not in (
      select v.id from crm_vista_relaciones v join _rels x on x.id = v.id
       order by v.temperatura desc nulls last, v.created_at desc limit greatest(p_cantidad, 1));
  end if;

  with m as (
    update crm_relations c set responsable = p_a from _rels x where c.id = x.id returning c.id)
  insert into crm_reasignaciones (lote, tabla, fila, de, a, por) select v_lote, 'crm_relations', id, p_de, p_a, v_por from m;
  get diagnostics r = row_count;

  with m as (
    update crm_tareas k set responsable = p_a
     where k.responsable = p_de and not k.hecha
       and (p_alcance = 'todo'
            or (p_alcance = 'vencidas' and k.vence < now())
            or (p_alcance = 'calientes' and k.contact_id in (select contact_id from _rels)))
    returning k.id)
  insert into crm_reasignaciones (lote, tabla, fila, de, a, por) select v_lote, 'crm_tareas', id, p_de, p_a, v_por from m;
  get diagnostics t = row_count;

  insert into crm_activities (contact_id, tipo, detalle)
    select distinct c.contact_id, 'reasignacion', jsonb_build_object('de', p_de, 'a', p_a, 'lote', v_lote, 'alcance', p_alcance)
      from crm_reasignaciones g join crm_relations c on c.id = g.fila where g.lote = v_lote and g.tabla = 'crm_relations';
  return jsonb_build_object('lote', v_lote, 'tareas', t, 'oportunidades', r);
end $$;

-- Deshace un lote: devuelve solo lo que sigue a nombre de quien lo tomó (no pisa cambios posteriores).
create or replace function crm_revertir_reasignacion(p_lote uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare t int; r int;
begin
  if not crm_es_admin() then raise exception 'Solo un admin revierte reasignaciones'; end if;
  update crm_relations c set responsable = g.de from crm_reasignaciones g
   where g.lote = p_lote and g.tabla = 'crm_relations' and g.revertida_at is null and c.id = g.fila and c.responsable = g.a;
  get diagnostics r = row_count;
  update crm_tareas k set responsable = g.de from crm_reasignaciones g
   where g.lote = p_lote and g.tabla = 'crm_tareas' and g.revertida_at is null and k.id = g.fila and k.responsable = g.a and not k.hecha;
  get diagnostics t = row_count;
  update crm_reasignaciones set revertida_at = now() where lote = p_lote and revertida_at is null;
  return jsonb_build_object('tareas', t, 'oportunidades', r);
end $$;

create or replace function crm_ultimas_reasignaciones()
returns table (lote uuid, de text, a text, tareas bigint, oportunidades bigint, cuando timestamptz, revertida boolean)
language sql security definer set search_path = public as $$
  select lote, min(de), min(a), count(*) filter (where tabla = 'crm_tareas'), count(*) filter (where tabla = 'crm_relations'),
         min(created_at), bool_and(revertida_at is not null)
    from crm_reasignaciones where crm_es_admin() group by lote order by min(created_at) desc limit 5
$$;
revoke execute on function crm_reasignar(text, text, text, int), crm_revertir_reasignacion(uuid), crm_ultimas_reasignaciones() from anon, public;
grant execute on function crm_reasignar(text, text, text, int), crm_revertir_reasignacion(uuid), crm_ultimas_reasignaciones() to authenticated;

-- M3: los eventos de día completo bloquean la agenda salvo que en Google estén como "Disponible".
alter table crm_calendario_eventos add column if not exists libre boolean not null default false;

-- M13: índices duplicados
drop index if exists crm_contacts_lower_idx;
drop index if exists crm_envios_estado_programado_idx;
drop index if exists crm_tareas_contact_id_idx;
drop index if exists crm_tareas_responsable_hecha_vence_idx;
