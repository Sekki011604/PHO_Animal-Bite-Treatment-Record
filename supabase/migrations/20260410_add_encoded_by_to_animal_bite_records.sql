alter table public.animal_bite_records
  add column if not exists encoded_by uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint constraint_def
    join pg_class source_table
      on source_table.oid = constraint_def.conrelid
    join pg_namespace source_schema
      on source_schema.oid = source_table.relnamespace
    join pg_class target_table
      on target_table.oid = constraint_def.confrelid
    join pg_namespace target_schema
      on target_schema.oid = target_table.relnamespace
    join pg_attribute source_column
      on source_column.attrelid = source_table.oid
      and source_column.attnum = any (constraint_def.conkey)
    where constraint_def.contype = 'f'
      and source_schema.nspname = 'public'
      and source_table.relname = 'animal_bite_records'
      and source_column.attname = 'encoded_by'
      and target_schema.nspname = 'public'
      and target_table.relname = 'profiles'
  ) then
    alter table public.animal_bite_records
      add constraint animal_bite_records_encoded_by_fkey
      foreign key (encoded_by)
      references public.profiles (id)
      on delete set null;
  end if;
end
$$;

create index if not exists animal_bite_records_encoded_by_idx
  on public.animal_bite_records (encoded_by);
