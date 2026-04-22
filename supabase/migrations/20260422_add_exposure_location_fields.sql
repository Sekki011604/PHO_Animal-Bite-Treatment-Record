begin;

alter table public.animal_bite_records
  add column if not exists exposure_municipality text,
  add column if not exists exposure_barangay text,
  add column if not exists exposure_street text;

comment on column public.animal_bite_records.exposure_municipality is
  'Municipality where the biting incident happened.';

comment on column public.animal_bite_records.exposure_barangay is
  'Barangay where the biting incident happened.';

comment on column public.animal_bite_records.exposure_street is
  'Street or sitio details for the biting incident location.';

update public.animal_bite_records
set exposure_street = nullif(trim(place_of_exposure), '')
where coalesce(trim(exposure_street), '') = ''
  and coalesce(trim(place_of_exposure), '') <> '';

create index if not exists animal_bite_records_exposure_municipality_idx
  on public.animal_bite_records (exposure_municipality);

create index if not exists animal_bite_records_exposure_barangay_idx
  on public.animal_bite_records (exposure_barangay);

commit;
