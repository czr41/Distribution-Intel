with inserted_brands as (
  insert into brands (name, category, contact_person, contact_email, contact_phone, status)
  values
    ('NourishCo', 'Nutrition', 'Ananya Rao', 'ananya@nourishco.example', '+91 90000 20001', 'active'),
    ('GlowWell', 'Personal care', 'Karan Mehta', 'karan@glowwell.example', '+91 90000 20002', 'active'),
    ('DailyBite', 'Packaged foods', 'Priya Nair', 'priya@dailybite.example', '+91 90000 20003', 'active')
  on conflict do nothing
  returning id, name
), all_brands as (
  select id, name from inserted_brands
  union
  select id, name from brands where name in ('NourishCo', 'GlowWell', 'DailyBite')
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
