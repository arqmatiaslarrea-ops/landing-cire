-- Lista de mails internos (cuentas propias que no son usuarios del CRM): no generan fichas ni leads desde la agenda.
-- Se carga desde la base, nunca en el código. Admin la mantiene.
create table if not exists crm_mails_internos (email text primary key, nota text, created_at timestamptz default now());
alter table crm_mails_internos enable row level security;
create policy mails_internos_admin on crm_mails_internos for all to authenticated using (crm_es_admin()) with check (crm_es_admin());
