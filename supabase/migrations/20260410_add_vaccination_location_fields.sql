alter table public.animal_bite_records
  add column if not exists day_0_location text,
  add column if not exists day_3_location text,
  add column if not exists day_7_location text,
  add column if not exists day_14_location text,
  add column if not exists day_28_location text;
