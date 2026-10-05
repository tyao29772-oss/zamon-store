-- Zamon Store — 8-migratsiya: admin paneldagi «Statistika».
--
-- Qanday ishga tushiriladi: Supabase → SQL Editor → New query → shu faylni to‘liq
-- joylashtiring → Run. Qayta ishga tushirish xavfsiz.
--
-- `admin_stats(dan, gacha, vaqt_mintaqasi)` — buyurtmalar va saytdagi voqealarni bazaning
-- o‘zida sanaydi va bitta JSON qaytaradi. Shunda voqealar yuz minglab bo‘lsa ham sahifa tez
-- ochiladi (serverga xom qatorlar emas, tayyor sonlar keladi).
-- Faqat server kaliti (service_role) chaqira oladi.

create index if not exists events_created_at_idx on public.events (created_at desc);

create or replace function public.admin_stats(p_from timestamptz, p_to timestamptz, p_tz text default 'Asia/Tashkent')
returns jsonb
language sql
stable
set search_path = ''
as $$
with
o as (
  select product_id, product_name, price, status, created_at
  from public.orders
  where created_at >= p_from and created_at < p_to
),
e as (
  select name, session_id, payload, created_at
  from public.events
  where created_at >= p_from and created_at < p_to
),
-- Qidiruvlar: harf terilayotganda yozilgan oraliq so‘zlar («ip», «iph» → «iphone») tashlab yuboriladi.
s as (
  select
    session_id,
    lower(btrim(payload->>'query')) as q,
    case when payload->>'resultCount' ~ '^[0-9]{1,9}$' then (payload->>'resultCount')::int else 0 end as results,
    created_at
  from e
  where name = 'search' and btrim(coalesce(payload->>'query', '')) <> ''
),
s_final as (
  select session_id, q, results, created_at
  from (
    select s.*, lead(q) over w as next_q, lead(created_at) over w as next_t
    from s
    window w as (partition by session_id order by created_at)
  ) x
  where not (
    next_q is not null and next_q <> q and starts_with(next_q, q)
    and next_t - created_at < interval '30 seconds'
  )
),
searches as (
  select
    q,
    count(distinct session_id) as people,
    (array_agg(results order by created_at desc))[1] as last_results
  from s_final
  group by q
),
product_events as (
  select
    payload->>'productId' as product_id,
    count(*) filter (where name = 'product_view') as views,
    count(distinct session_id) filter (where name = 'product_view') as viewers,
    count(*) filter (where name = 'telegram_order_click') as order_clicks
  from e
  where name in ('product_view', 'telegram_order_click') and coalesce(payload->>'productId', '') <> ''
  group by 1
)
select jsonb_build_object(
  'orders', (
    select jsonb_build_object(
      'total', count(*) filter (where status <> 'cancelled'),
      'done', count(*) filter (where status = 'done'),
      'open', count(*) filter (where status in ('new', 'contacted')),
      'cancelled', count(*) filter (where status = 'cancelled'),
      'revenueDone', coalesce(sum(price) filter (where status = 'done'), 0),
      'revenueOpen', coalesce(sum(price) filter (where status in ('new', 'contacted')), 0)
    )
    from o
  ),
  'traffic', (
    select jsonb_build_object(
      'visitors', count(distinct session_id),
      'views', count(*) filter (where name = 'product_view'),
      'orderClicks', count(*) filter (where name = 'telegram_order_click'),
      'searches', (select count(*) from s_final),
      'favorites', count(*) filter (where name = 'favorite_toggle' and payload->>'added' = 'true')
    )
    from e
  ),
  'days', coalesce((
    select jsonb_agg(jsonb_build_object('day', day, 'visitors', visitors, 'views', views, 'orders', orders, 'revenue', revenue) order by day)
    from (
      select
        day,
        coalesce(max(visitors), 0) as visitors,
        coalesce(max(views), 0) as views,
        coalesce(max(orders), 0) as orders,
        coalesce(max(revenue), 0) as revenue
      from (
        select (created_at at time zone p_tz)::date as day,
               count(distinct session_id) as visitors,
               count(*) filter (where name = 'product_view') as views,
               null::bigint as orders, null::bigint as revenue
        from e group by 1
        union all
        select (created_at at time zone p_tz)::date,
               null, null,
               count(*) filter (where status <> 'cancelled'),
               coalesce(sum(price) filter (where status = 'done'), 0)
        from o group by 1
      ) u
      group by day
    ) d
  ), '[]'::jsonb),
  'topViewed', coalesce((
    select jsonb_agg(jsonb_build_object('productId', product_id, 'views', views, 'viewers', viewers, 'orderClicks', order_clicks) order by views desc, product_id)
    from (select * from product_events where views > 0 order by views desc, product_id limit 10) t
  ), '[]'::jsonb),
  'topOrdered', coalesce((
    select jsonb_agg(jsonb_build_object('productId', product_id, 'productName', product_name, 'orders', orders, 'revenue', revenue) order by orders desc, revenue desc)
    from (
      select product_id, max(product_name) as product_name, count(*) as orders,
             coalesce(sum(price) filter (where status = 'done'), 0) as revenue
      from o where status <> 'cancelled'
      group by product_id
      order by orders desc, revenue desc
      limit 10
    ) t
  ), '[]'::jsonb),
  'topSearches', coalesce((
    select jsonb_agg(jsonb_build_object('query', q, 'people', people, 'results', last_results) order by people desc, q)
    from (select * from searches order by people desc, q limit 20) t
  ), '[]'::jsonb),
  'missedSearches', coalesce((
    select jsonb_agg(jsonb_build_object('query', q, 'people', people) order by people desc, q)
    from (select * from searches where last_results = 0 order by people desc, q limit 20) t
  ), '[]'::jsonb)
);
$$;

revoke all on function public.admin_stats(timestamptz, timestamptz, text) from public, anon, authenticated;
grant execute on function public.admin_stats(timestamptz, timestamptz, text) to service_role;
