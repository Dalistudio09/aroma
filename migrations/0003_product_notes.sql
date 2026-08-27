alter table products add column if not exists brand text not null default 'Aroma';
alter table products add column if not exists family text not null default '';
alter table products add column if not exists top_notes text not null default '';
alter table products add column if not exists heart_notes text not null default '';
alter table products add column if not exists base_notes text not null default '';
