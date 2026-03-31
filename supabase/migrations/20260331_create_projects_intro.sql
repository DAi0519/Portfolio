create table if not exists public.projects_intro (
  id text primary key,
  title text not null,
  date date,
  description text default '',
  tags text[] default '{}'::text[],
  link text,
  image_url text,
  content text,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.projects_intro enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'projects_intro'
      and policyname = 'Allow public read access to projects_intro'
  ) then
    create policy "Allow public read access to projects_intro"
      on public.projects_intro
      for select
      to anon, authenticated
      using (true);
  end if;
end
$$;
