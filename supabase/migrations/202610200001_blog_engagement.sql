-- Run once in the Supabase SQL Editor as the project owner.
begin;

create table public.blog_posts (
  id text primary key check (id ~ '^/blog/[^/]+/$')
);

-- Use the rendered page.url, not the article's display title.
insert into public.blog_posts (id) values
  ('/blog/test-article/'),
  ('/blog/how-to-study-mathematics/');

create table public.blog_likes (
  post_id text not null references public.blog_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table public.blog_comments (
  id uuid primary key default gen_random_uuid(),
  post_id text not null references public.blog_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 60),
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  approved boolean not null default false,
  created_at timestamptz not null default now()
);
create index blog_comments_public_feed on public.blog_comments (post_id, created_at desc, id desc)
  where approved;
create index blog_comments_guest_rate on public.blog_comments (user_id, created_at desc);

alter table public.blog_posts enable row level security;
alter table public.blog_likes enable row level security;
alter table public.blog_comments enable row level security;

-- No direct writes, voter lists, guest IDs or pending comments in the browser API.
revoke all on public.blog_posts, public.blog_likes, public.blog_comments from anon, authenticated;
grant select (id, post_id, display_name, body, approved, created_at)
  on public.blog_comments to anon, authenticated;
create policy "Read approved comments" on public.blog_comments
  for select to anon, authenticated using (approved);

-- These functions deliberately use definer privileges to expose aggregates and
-- restricted writes without granting access to private guest IDs or moderation.
create function public.get_blog_likes(p_post_id text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'like_count', (select count(*) from public.blog_likes where post_id = p_post_id),
    'liked', exists(select 1 from public.blog_likes
      where post_id = p_post_id and user_id = (select auth.uid()))
  );
$$;

create function public.set_blog_like(p_post_id text, p_liked boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  guest_id uuid := auth.uid();
begin
  if guest_id is null then
    raise exception 'Guest session required' using errcode = '42501';
  end if;
  if p_liked is null or not exists(select 1 from public.blog_posts where id = p_post_id) then
    raise exception 'Article unavailable' using errcode = '22023';
  end if;
  -- Serialize writes for this guest, including simultaneous browser tabs.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(guest_id::text, 0));
  if p_liked then
    insert into public.blog_likes(post_id, user_id) values (p_post_id, guest_id)
      on conflict do nothing;
  else
    delete from public.blog_likes where post_id = p_post_id and user_id = guest_id;
  end if;
  return public.get_blog_likes(p_post_id);
end;
$$;

create function public.submit_blog_comment(p_post_id text, p_display_name text, p_body text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  guest_id uuid := auth.uid();
begin
  if guest_id is null then
    raise exception 'Guest session required' using errcode = '42501';
  end if;
  if not exists(select 1 from public.blog_posts where id = p_post_id) then
    raise exception 'Article unavailable' using errcode = '22023';
  end if;
  if p_display_name is null or char_length(btrim(p_display_name)) not between 1 and 60
    or p_body is null or char_length(btrim(p_body)) not between 1 and 2000 then
    raise exception 'Invalid comment' using errcode = '22023';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(guest_id::text, 0));
  if exists(select 1 from public.blog_comments
    where user_id = guest_id and created_at > now() - interval '1 minute') then
    raise exception 'Please wait a minute before commenting again.' using errcode = 'P0001';
  end if;
  if (select count(*) from public.blog_comments
    where user_id = guest_id and created_at > now() - interval '1 day') >= 10 then
    raise exception 'Please try again tomorrow. You have reached the daily comment limit.' using errcode = 'P0001';
  end if;
  insert into public.blog_comments(post_id, user_id, display_name, body)
    values (p_post_id, guest_id, btrim(p_display_name), btrim(p_body));
end;
$$;

revoke all on function public.get_blog_likes(text) from public, anon, authenticated;
revoke all on function public.set_blog_like(text, boolean) from public, anon, authenticated;
revoke all on function public.submit_blog_comment(text, text, text) from public, anon, authenticated;
grant execute on function public.get_blog_likes(text) to anon, authenticated;
grant execute on function public.set_blog_like(text, boolean) to authenticated;
grant execute on function public.submit_blog_comment(text, text, text) to authenticated;

commit;
