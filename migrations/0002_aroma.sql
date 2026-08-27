-- Aroma perfume shop catalog and orders
create table if not exists products (
  id          serial primary key,
  name        text not null,
  category    text not null,
  volume      text not null,
  price       integer not null,
  description text not null default '',
  stock       integer not null default 0,
  photo_url   text,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists orders (
  id               serial primary key,
  telegram_user_id text not null,
  customer_name    text not null,
  phone            text not null,
  fulfillment      text not null,
  address          text,
  comment          text,
  items_json       text not null,
  total            integer not null,
  status           text not null default 'new',
  created_at       timestamptz not null default now()
);

create index if not exists orders_telegram_user_id_idx on orders (telegram_user_id);
create index if not exists orders_created_at_idx on orders (created_at desc);
create index if not exists products_category_idx on products (category);
create index if not exists products_active_idx on products (active);
