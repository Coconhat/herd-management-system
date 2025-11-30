CREATE TABLE public.health_records (
  id serial not null,
  animal_id integer not null,
  record_date date not null,
  record_type character varying(50) not null,
  description text null,
  treatment text null,
  veterinarian character varying(100) null,
  cost numeric(10, 2) null,
  notes text null,
  user_id uuid not null,
  created_at timestamp without time zone null default CURRENT_TIMESTAMP,
  syringes_used integer not null default 0,
  syringe_type character varying null,
  constraint health_records_pkey primary key (id),
  constraint health_records_animal_id_fkey foreign KEY (animal_id) references animals (id),
  constraint health_records_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_health_records_animal_id ON public.health_records USING btree (animal_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_health_records_user_id ON public.health_records USING btree (user_id) TABLESPACE pg_default;
