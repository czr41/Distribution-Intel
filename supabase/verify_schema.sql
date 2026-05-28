select
  table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'users',
    'brands',
    'territories',
    'field_executives',
    'outlets',
    'outlet_brands',
    'incoming_messages',
    'message_ai_extractions',
    'verification_queue',
    'message_classifications',
    'draft_business_records',
    'visits',
    'skus',
    'orders',
    'order_items',
    'bills',
    'bill_items',
    'payments',
    'competitor_insights',
    'tasks',
    'audit_logs'
  )
order by table_name;
