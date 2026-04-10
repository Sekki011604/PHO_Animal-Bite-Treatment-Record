begin;

alter table public.animal_bite_records
  add column if not exists rig_type text not null default 'none',
  add column if not exists rig_volume numeric;

comment on column public.animal_bite_records.rig_type is
  'Rabies immunoglobulin type: none, erig, or hrig.';

comment on column public.animal_bite_records.rig_volume is
  'Auto-computed rabies immunoglobulin volume in milliliters.';

update public.animal_bite_records
set rig_volume = nullif(trim(erig_hrig_computed_dose), '')::numeric
where rig_volume is null
  and coalesce(trim(erig_hrig_computed_dose), '') ~ '^[0-9]+(\.[0-9]+)?$';

commit;
