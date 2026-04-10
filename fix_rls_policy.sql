alter table public.animal_bite_records enable row level security;
alter table public.animal_bite_records force row level security;

do $$
declare
  existing_policy text;
begin
  for existing_policy in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'animal_bite_records'
      and cmd in ('SELECT', 'ALL')
  loop
    execute format('drop policy if exists %I on public.animal_bite_records', existing_policy);
  end loop;
end
$$;

create policy animal_bite_records_select_strict_tenant_isolation
on public.animal_bite_records
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles current_profile
    where current_profile.id = auth.uid()
      and current_profile.role = 'admin'
  )
  or exists (
    select 1
    from public.profiles current_profile
    where current_profile.id = auth.uid()
      and current_profile.role = 'staff'
      and nullif(btrim(current_profile.barangay), '') is not null
      and nullif(btrim(current_profile.barangay), '') = (
        select nullif(btrim(encoded_profile.barangay), '')
        from public.profiles encoded_profile
        where encoded_profile.id = animal_bite_records.encoded_by
      )
  )
);
