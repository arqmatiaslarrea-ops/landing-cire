-- Arreglos de la auditoría del 23/11/2026 (ver cerebro/29-handoff-revision-crm.md y la auditoría)

-- C1: los leads NUEVOS de la landing inmobiliaria van a Juan solo si está activo; si no, a Mati (lo viejo no se toca)
create or replace function public.trg_inmo_lead_to_crm() returns trigger language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_rel uuid; v_nueva boolean; v_resp text; v_etapa text := 'nuevo'; v_estado crm_estado_rel := 'prospecto'; e text := lower(coalesce(new.estado_importado,''));
  v_asignar text := case when exists (select 1 from crm_usuarios where clave = 'juan_buceta' and activo) then 'juan_buceta' else 'mati' end;
begin
  v_id := crm_upsert_contact(new.nombre, new.email, new.telefono);
  update crm_contacts set barrio = coalesce(barrio, new.barrio) where id = v_id;
  insert into crm_contact_profiles (contact_id, perfil, datos)
  values (v_id, 'vendedor_motivado', jsonb_strip_nulls(jsonb_build_object(
    'direccion', new.direccion, 'barrio', new.barrio, 'tipo_propiedad', new.tipo_propiedad,
    'ambientes', new.ambientes, 'situacion', new.situacion, 'urgencia', new.urgencia,
    'expectativa_precio', new.expectativa_precio, 'precio_pretendido', new.precio_pretendido,
    'paga_expensas', new.paga_expensas, 'tamanio_m2', new.tamanio_m2, 'consent_whatsapp', new.consent_whatsapp,
    'info_adicional', new.info_adicional)))
  on conflict (contact_id, perfil) do update set datos = crm_contact_profiles.datos || excluded.datos, updated_at = now();
  if e <> '' then
    v_etapa := case
      when e like 'descartado%' then 'descartado'
      when e like 'referido a abogado%' then 'derivado_abogado'
      when e like 'referido%' then 'derivado_inmobiliaria'
      when e like 'cerrado%' then 'cerrado'
      when e like 'propuesta%' then 'oferta_enviada'
      when e like 'calificado%' then 'calificado'
      when e like 'contactado%' then 'contactado'
      when e like 'por contactar%' or e = 'nuevo' then 'nuevo'
      else 'contactado' end;
    if v_etapa = 'descartado' then v_estado := 'descartado'; end if;
  end if;
  insert into crm_relations (contact_id, unidad, embudo, responsable, origen, etapa, estado, created_at)
  values (v_id, 'inmobiliaria', 'vendedores_motivados', v_asignar, coalesce(new.origen_importacion, 'cireinmobiliaria.com'), v_etapa, v_estado, new.created_at)
  on conflict (contact_id, unidad, embudo) do update set updated_at = now()
  returning id, (xmax = 0), responsable into v_rel, v_nueva, v_resp;
  if not v_nueva and new.origen_importacion is null then
    update crm_relations set estado = case when estado = 'descartado' then 'prospecto' else estado end where id = v_rel;
    insert into crm_tareas (contact_id, relation_id, unidad, tipo, titulo, vence, responsable, prioridad, origen)
    values (v_id, v_rel, 'inmobiliaria', 'llamar', 'Volvió a dejar sus datos en la landing: llamar ya', now(),
      case when exists (select 1 from crm_usuarios where clave = v_resp and activo) then v_resp else 'mati' end, 'alta', 'automatizacion');
  end if;
  insert into crm_activities (contact_id, unidad, tipo, detalle, created_at)
  values (v_id, 'inmobiliaria', case when new.origen_importacion is null then 'formulario_web' else 'importado' end,
    jsonb_strip_nulls(jsonb_build_object('landing','cireinmobiliaria.com','lead_id',new.id,'fuente',new.origen_importacion,'estado_original',new.estado_importado,'repetido', not v_nueva)), new.created_at);
  return new;
end $$;

-- Tarea de primer contacto: si la relación es de alguien inactivo, la tarea va a Mati
create or replace function public.trg_rel_lead_nuevo() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (new.origen like any (array['cireinmobiliaria.com%','cireinversores.com%','cireinversores.org%','rankaagency.com%','Meta · %'])) and new.created_at > now() - interval '1 day' then
    insert into crm_tareas (contact_id, relation_id, unidad, tipo, titulo, vence, responsable, prioridad, origen)
    values (new.contact_id, new.id, new.unidad, 'llamar', 'Primer contacto: lead nuevo de ' || new.origen, now() + interval '5 minutes',
            case when exists (select 1 from crm_usuarios where clave = new.responsable and activo) then new.responsable else 'mati' end, 'alta', 'sistema');
    perform public.crm_llamar_funcion('crm-notificar', jsonb_build_object('tipo','lead_nuevo','relation_id', new.id));
  end if;
  return new;
end $$;

-- I14: inversores entra por cireinversores.com (el .org ya no es de CIRE); los patrones aceptan los dos
create or replace function public.trg_rel_inscribir() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (new.origen like any (array['cireinmobiliaria.com%','cireinversores.com%','cireinversores.org%','rankaagency.com%','Meta · %'])) and new.created_at > now() - interval '1 day'
     and exists (select 1 from crm_contacts c where c.id = new.contact_id and c.email is not null) then
    insert into crm_inscripciones (secuencia_id, contact_id, relation_id)
    select s.id, new.contact_id, new.id from crm_secuencias s where s.embudo = new.embudo and s.activa
    on conflict do nothing;
  end if;
  return new;
end $$;

create or replace function public.trg_inv_lead_to_crm() returns trigger language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  v_id := crm_upsert_contact(new.nombre, new.email, new.telefono);
  insert into crm_contact_profiles (contact_id, perfil, datos)
  values (v_id, 'inversor', jsonb_strip_nulls(jsonb_build_object(
    'capital', new.capital, 'condicion_fiscal', new.perfil, 'experiencia', new.experiencia,
    'plazo', new.plazo, 'objetivo', new.objetivo, 'decision', new.decision,
    'ciudad', new.ciudad, 'score', new.score, 'fuente', new.fuente)))
  on conflict (contact_id, perfil) do update set datos = crm_contact_profiles.datos || excluded.datos, updated_at = now();
  insert into crm_relations (contact_id, unidad, embudo, responsable, origen, created_at)
  values (v_id, 'desarrolladora', 'inversores', 'mati', coalesce(new.origen_importacion, 'cireinversores.com'), new.created_at)
  on conflict (contact_id, unidad, embudo) do update set updated_at = now();
  insert into crm_activities (contact_id, unidad, tipo, detalle, created_at)
  values (v_id, 'desarrolladora', case when new.origen_importacion is null then 'formulario_web' else 'importado' end,
    jsonb_strip_nulls(jsonb_build_object('landing','cireinversores.com','tipo_lead',new.tipo_lead,'lead_id',new.id,'fuente',new.origen_importacion)), new.created_at);
  return new;
end $$;

-- I4: agendar una llamada pausa la secuencia (la hace el sistema, por eso antes no la tomaba)
create or replace function public.trg_act_pausa_secuencia() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (new.autor <> 'sistema' and new.tipo in ('llamada','whatsapp','visita','reunion','descubrimiento')) or new.tipo = 'reunion_agendada' then
    update crm_inscripciones set estado = 'pausada_humano', motivo_fin = case when new.tipo = 'reunion_agendada' then 'Agendó llamada' else 'Gestión de ' || new.autor end
     where contact_id = new.contact_id and estado = 'activa';
  end if;
  return new;
end $$;

-- I12: una actividad sin unidad no marca primer contacto en todas las unidades
create or replace function public.trg_act_primer_contacto() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.autor <> 'sistema' and new.unidad is not null and new.tipo in ('llamada','whatsapp','visita','reunion','nota','descubrimiento','email') then
    update crm_relations set primer_contacto_at = new.created_at
     where contact_id = new.contact_id and primer_contacto_at is null and unidad = new.unidad;
  end if;
  return new;
end $$;

-- I2: si un formulario completa el email o trae otro nombre para una ficha existente, queda registrado para verificar
create or replace function public.crm_upsert_contact(p_nombre text, p_email text, p_tel text) returns uuid language plpgsql security definer set search_path = public as $$
declare v_norm text; v_id uuid; v_prev record;
begin
  v_norm := nullif(regexp_replace(coalesce(p_tel,''), '\D', '', 'g'), '');
  if v_norm is not null and length(v_norm) >= 10 then v_norm := right(v_norm, 10); end if;
  if v_norm is not null then select id into v_id from crm_contacts where telefono_norm = v_norm; end if;
  if v_id is null and nullif(p_email,'') is not null then
    select id into v_id from crm_contacts where lower(email) = lower(p_email) limit 1;
  end if;
  if v_id is null then
    insert into crm_contacts (nombre, email, telefono, telefono_norm)
    values (p_nombre, nullif(p_email,''), p_tel, v_norm) returning id into v_id;
  else
    select email, telefono, nombre into v_prev from crm_contacts where id = v_id;
    update crm_contacts set email = coalesce(email, nullif(p_email,'')),
      telefono = coalesce(telefono, p_tel), telefono_norm = coalesce(telefono_norm, v_norm),
      updated_at = now() where id = v_id;
    if (v_prev.email is null and nullif(p_email,'') is not null)
       or (v_prev.email is not null and nullif(p_email,'') is not null and lower(v_prev.email) <> lower(p_email))
       or (p_nombre is not null and lower(coalesce(v_prev.nombre,'')) <> lower(p_nombre)) then
      insert into crm_activities (contact_id, tipo, autor, detalle)
      values (v_id, 'dato_a_verificar', 'sistema', jsonb_strip_nulls(jsonb_build_object(
        'motivo', 'Entró un formulario que coincide con esta ficha por teléfono o email: verificá que sea la misma persona',
        'nombre_recibido', p_nombre, 'email_recibido', nullif(p_email,''), 'email_ficha', v_prev.email, 'nombre_ficha', v_prev.nombre)));
    end if;
  end if;
  return v_id;
end $$;

-- C3: un solo turno activo por responsable y horario
create unique index if not exists crm_reuniones_turno_unico on public.crm_reuniones (responsable, inicio) where estado in ('agendada','confirmada');

-- C2: registro de intentos de reserva para limitar por IP (el endpoint es público)
create table if not exists public.crm_reservas_intentos (id bigserial primary key, ip text not null, lead_id text, created_at timestamptz not null default now());
create index if not exists crm_reservas_intentos_ip on public.crm_reservas_intentos (ip, created_at);
alter table public.crm_reservas_intentos enable row level security;

-- I16: feriados en tabla (fuente: calendario oficial publicado; los días turísticos de 2027 se agregan cuando se publiquen)
create table if not exists public.crm_feriados (fecha date primary key, nombre text not null);
alter table public.crm_feriados enable row level security;
drop policy if exists "lectura feriados" on public.crm_feriados;
create policy "lectura feriados" on public.crm_feriados for select to authenticated using (true);
insert into public.crm_feriados values
 ('2026-12-07','Día no laborable con fines turísticos'),('2026-12-08','Inmaculada Concepción'),('2026-12-25','Navidad'),
 ('2027-01-01','Año Nuevo'),('2027-02-08','Carnaval'),('2027-02-09','Carnaval'),('2027-03-24','Día de la Memoria'),
 ('2027-03-25','Jueves Santo (no laborable)'),('2027-03-26','Viernes Santo'),('2027-04-02','Malvinas'),('2027-05-25','Revolución de Mayo'),
 ('2027-06-21','Güemes (trasladado)'),('2027-07-09','Independencia'),('2027-08-16','San Martín (trasladado)'),('2027-10-11','Diversidad Cultural (trasladado)'),
 ('2027-12-08','Inmaculada Concepción')
on conflict (fecha) do update set nombre = excluded.nombre;

-- M12: sacar la función que quedó del piloto y cerrar la ejecución anónima de las funciones de trigger
drop function if exists public.crm_responsable_activo(text, text);
do $$ declare f record; begin
  for f in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname like 'trg\_%' loop
    execute format('revoke execute on function %s from anon, authenticated, public', f.sig);
  end loop;
end $$;

-- C4/I3: cancelar o mover en el CRM una reserva hecha desde la landing le avisa al lead y a la agenda de Mati
alter table public.crm_reuniones add column if not exists secuencia_ics integer not null default 0;
create or replace function public.trg_reunion_reserva_cambio() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce(new.google_event_id,'') like 'reserva-%' and (
       (new.estado = 'cancelada' and old.estado is distinct from 'cancelada')
    or (new.inicio is distinct from old.inicio and new.estado in ('agendada','confirmada'))) then
    perform public.crm_llamar_funcion('crm-reservas', jsonb_build_object('accion', case when new.estado = 'cancelada' then 'cancelar' else 'reprogramar' end, 'id', new.id));
  end if;
  return new;
end $$;
revoke execute on function public.trg_reunion_reserva_cambio() from anon, authenticated, public;
drop trigger if exists reunion_reserva_cambio on public.crm_reuniones;
create trigger reunion_reserva_cambio after update of estado, inicio on public.crm_reuniones for each row execute function public.trg_reunion_reserva_cambio();

-- I8/M8: una reoferta no suma otra oferta al plan 260; vence cuenta feriados; el cambio a "contraoferta" solo cuando se carga el número
create or replace function public.trg_oferta_defaults() returns trigger language plpgsql set search_path = public as $$
begin
  new.cuenta_plan_260 := new.fecha >= date '2026-10-05' and new.reemplaza_id is null;
  if new.vence is null and new.validez_dias_habiles is not null then
    new.vence := (select d::date from generate_series(new.fecha + 1, new.fecha + 30, interval '1 day') d
                  where extract(isodow from d) < 6 and d::date not in (select fecha from crm_feriados) offset new.validez_dias_habiles - 1 limit 1);
  end if;
  if new.estado in ('borrador') then new.estado := 'enviada'; end if;
  if new.estado = 'vencida' then new.estado := 'sin_respuesta'; end if;
  if tg_op = 'INSERT' and new.estado = 'enviada' and new.contraoferta_usd is not null then new.estado := 'contraoferta'; end if;
  if tg_op = 'UPDATE' and new.estado = 'enviada' and new.contraoferta_usd is not null and old.contraoferta_usd is null then new.estado := 'contraoferta'; end if;
  new.etapa_loacc := case
    when new.estado = 'cerrada' then 'C2'
    when new.estado = 'aceptada' then 'C1'
    when new.visitada then 'A'
    else 'O' end;
  new.updated_at := now();
  return new;
end $$;

-- I11 (parcial, respetando "todos ven todo, cada uno opera su unidad"): editar una ficha solo si sos admin o operás alguna de sus oportunidades
create or replace function public.crm_opera_contacto(p_contact uuid) returns boolean language sql stable security definer set search_path = public as $$
  select crm_es_admin()
      or exists (select 1 from crm_relations r where r.contact_id = p_contact and crm_opera(r.unidad))
      or not exists (select 1 from crm_relations r where r.contact_id = p_contact);
$$;
drop policy if exists "contactos: edicion" on public.crm_contacts;
create policy "contactos: edicion" on public.crm_contacts for update to authenticated using (crm_activo() and crm_opera_contacto(id)) with check (crm_activo() and crm_opera_contacto(id));
drop policy if exists "perfiles: edicion" on public.crm_contact_profiles;
create policy "perfiles: edicion" on public.crm_contact_profiles for update to authenticated using (crm_activo() and crm_opera_contacto(contact_id)) with check (crm_activo() and crm_opera_contacto(contact_id));
-- Los formularios crudos de las landings solo para quien opera esa unidad
drop policy if exists "lectura usuarios activos" on public.inmo_leads;
create policy "lectura usuarios activos" on public.inmo_leads for select to authenticated using (crm_es_admin() or crm_opera('inmobiliaria'::crm_unidad));
drop policy if exists "lectura usuarios activos" on public.inv_leads;
create policy "lectura usuarios activos" on public.inv_leads for select to authenticated using (crm_es_admin() or crm_opera('desarrolladora'::crm_unidad));
