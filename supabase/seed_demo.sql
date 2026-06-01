with inserted_brands as (
  insert into brands (name, category, contact_person, contact_email, contact_phone, status)
  values
    ('NourishCo', 'Nutrition', 'Ananya Rao', 'ananya@nourishco.example', '+91 90000 20001', 'active'),
    ('GlowWell', 'Personal care', 'Karan Mehta', 'karan@glowwell.example', '+91 90000 20002', 'active'),
    ('DailyBite', 'Packaged foods', 'Priya Nair', 'priya@dailybite.example', '+91 90000 20003', 'active'),
    ('Nestle', 'Food and beverage', 'Nestle India Trade Desk', 'trade@nestle.example', '+91 90000 20004', 'active')
  on conflict do nothing
  returning id, name
), all_brands as (
  select id, name from inserted_brands
  union
  select id, name from brands where name in ('NourishCo', 'GlowWell', 'DailyBite', 'Nestle')
), inserted_territories as (
  insert into territories (name, city, state, region, status)
  values
    ('Pune West', 'Pune', 'Maharashtra', 'West', 'active'),
    ('Nashik Core', 'Nashik', 'Maharashtra', 'West', 'active'),
    ('Thane Retail', 'Thane', 'Maharashtra', 'West', 'active')
  on conflict do nothing
  returning id, name
), all_territories as (
  select id, name from inserted_territories
  union
  select id, name from territories where name in ('Pune West', 'Nashik Core', 'Thane Retail')
), inserted_users as (
  insert into users (name, email, phone, role, status)
  values
    ('Meera S.', 'meera.field@example.com', '+91 98888 10001', 'field_executive', 'active'),
    ('Arjun K.', 'arjun.field@example.com', '+91 98888 10002', 'field_executive', 'active'),
    ('Ravi M.', 'ravi.field@example.com', '+91 98888 10003', 'field_executive', 'active'),
    ('Ops Manager', 'ops.manager@example.com', '+91 98888 19999', 'operations_manager', 'active')
  on conflict (email) do nothing
  returning id, name, email, phone
), all_users as (
  select id, name, email, phone from inserted_users
  union
  select id, name, email, phone from users where email in ('meera.field@example.com', 'arjun.field@example.com', 'ravi.field@example.com', 'ops.manager@example.com')
), inserted_executives as (
  insert into field_executives (user_id, phone, whatsapp_number, territory_id, status)
  select u.id, u.phone, u.phone, t.id, 'active'
  from all_users u
  join all_territories t on t.name = case
    when u.email = 'meera.field@example.com' then 'Pune West'
    when u.email = 'arjun.field@example.com' then 'Nashik Core'
    when u.email = 'ravi.field@example.com' then 'Thane Retail'
  end
  where u.email in ('meera.field@example.com', 'arjun.field@example.com', 'ravi.field@example.com')
    and not exists (select 1 from field_executives fe where fe.user_id = u.id)
  returning id, user_id
), all_executives as (
  select fe.id, u.email
  from field_executives fe
  join all_users u on u.id = fe.user_id
), outlet_seed as (
  select seed.*, t.id as territory_id, e.id as executive_id
  from (
    values
      ('Raj Stores', 'Raj Patil', '+91 90000 10001', 'Pune', 'Kirana store', 'Kirana', 'Pune West', 'meera.field@example.com', 'active'),
      ('Fresh Basket', 'S. Kale', '+91 90000 10002', 'Nashik', 'Supermarket', 'Modern trade', 'Nashik Core', 'arjun.field@example.com', 'prospect'),
      ('Metro Mini Mart', 'Nisha Shah', '+91 90000 10003', 'Mumbai', 'Supermarket', 'Modern trade', 'Thane Retail', 'ravi.field@example.com', 'active'),
      ('Om Super Shop', 'Omkar Jadhav', '+91 90000 10004', 'Thane', 'Kirana store', 'Kirana', 'Thane Retail', 'ravi.field@example.com', 'active')
  ) as seed(outlet_name, owner_name, phone, city, category, channel_type, territory_name, executive_email, status)
  join all_territories t on t.name = seed.territory_name
  join all_executives e on e.email = seed.executive_email
), inserted_outlets as (
  insert into outlets (name, owner_name, phone, whatsapp_number, city, state, category, channel_type, territory_id, assigned_executive_id, status)
  select outlet_name, owner_name, phone, phone, city, 'Maharashtra', category, channel_type, territory_id, executive_id, status
  from outlet_seed
  where not exists (select 1 from outlets o where o.name = outlet_seed.outlet_name and o.phone = outlet_seed.phone)
  returning id, name
), all_outlets as (
  select id, name from inserted_outlets
  union
  select id, name from outlets where name in ('Raj Stores', 'Fresh Basket', 'Metro Mini Mart', 'Om Super Shop')
)
insert into outlet_brands (outlet_id, brand_id, status, onboarded_at)
select o.id, b.id, 'active', now()
from all_outlets o
join all_brands b on b.name = case
  when o.name in ('Raj Stores', 'Om Super Shop') then 'NourishCo'
  when o.name = 'Fresh Basket' then 'GlowWell'
  when o.name = 'Metro Mini Mart' then 'DailyBite'
end
on conflict (outlet_id, brand_id) do nothing;

insert into outlet_brands (outlet_id, brand_id, status, onboarded_at)
select o.id, b.id, 'active', now()
from outlets o
join brands b on b.name = 'Nestle'
where o.name in ('Fresh Basket', 'Metro Mini Mart', 'Raj Stores')
on conflict (outlet_id, brand_id) do nothing;

insert into skus (brand_id, name, code, category, unit, mrp, status)
select b.id, seed.name, seed.code, seed.category, seed.unit, seed.mrp, 'active'
from brands b
cross join (
  values
    ('Maggi 2-Minute Masala Noodles 70g', 'NES-MAGGI-70', 'Instant noodles', '70g pack', 15),
    ('Nescafe Classic Instant Coffee 24g', 'NES-NESCAFE-24', 'Coffee', '24g jar', 115),
    ('KitKat 4 Finger Chocolate 37.3g', 'NES-KITKAT-37', 'Chocolate', '37.3g bar', 30),
    ('Nestle Munch Chocolate 23g', 'NES-MUNCH-23', 'Chocolate', '23g bar', 20),
    ('Milkmaid Sweetened Condensed Milk 380g', 'NES-MILKMAID-380', 'Dairy', '380g tin', 147)
) as seed(name, code, category, unit, mrp)
where b.name = 'Nestle'
  and not exists (select 1 from skus s where s.code = seed.code);

with order_seed as (
  select
    o.id as outlet_id,
    b.id as brand_id,
    s.id as sku_id,
    seed.quantity::numeric as quantity,
    seed.unit_price::numeric as unit_price,
    seed.expected_delivery_date::date as expected_delivery_date,
    seed.status
  from (
    values
      ('Raj Stores', 'NES-MAGGI-70', 24, 15, '2026-06-04', 'intent_captured'),
      ('Fresh Basket', 'NES-KITKAT-37', 36, 30, '2026-06-05', 'confirmed'),
      ('Metro Mini Mart', 'NES-NESCAFE-24', 12, 115, '2026-06-06', 'confirmed')
  ) as seed(outlet_name, sku_code, quantity, unit_price, expected_delivery_date, status)
  join outlets o on o.name = seed.outlet_name
  join skus s on s.code = seed.sku_code
  join brands b on b.id = s.brand_id
), inserted_orders as (
  insert into orders (outlet_id, brand_id, expected_value, expected_delivery_date, status)
  select outlet_id, brand_id, quantity * unit_price, expected_delivery_date, status
  from order_seed seed
  where not exists (
    select 1
    from orders existing
    join order_items existing_item on existing_item.order_id = existing.id
    where existing.outlet_id = seed.outlet_id
      and existing_item.sku_id = seed.sku_id
      and existing.expected_delivery_date = seed.expected_delivery_date
  )
  returning id, outlet_id, brand_id, expected_delivery_date
)
insert into order_items (order_id, sku_id, quantity, unit_price, total_value)
select inserted_orders.id, seed.sku_id, seed.quantity, seed.unit_price, seed.quantity * seed.unit_price
from inserted_orders
join order_seed seed
  on seed.outlet_id = inserted_orders.outlet_id
  and seed.brand_id = inserted_orders.brand_id
  and seed.expected_delivery_date = inserted_orders.expected_delivery_date;
