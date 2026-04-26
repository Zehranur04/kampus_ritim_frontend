-- create_notifications_on_event_insert.sql
-- Purpose: When a new event is inserted, create a notification row for every user.
-- Run in Supabase SQL Editor.
-- Assumptions:
-- - public."Events" exists and has columns "Id" and "Title".
-- - public."Users" exists and has integer PK column "Id".
-- - public."Notifications" exists (schema shared by the user).
--
-- If your Users table or Events columns differ, adapt identifiers accordingly.

begin;

create or replace function public.notify_users_on_event_insert()
returns trigger
language plpgsql
as $$
begin
  insert into public."Notifications" ("UserId", "Message", "IsRead", "RelatedEventId", "CreatedAt")
  select
    u."Id" as "UserId",
    ('Yeni etkinlik eklendi: ' || coalesce(new."Title", 'Etkinlik')) as "Message",
    false as "IsRead",
    new."Id" as "RelatedEventId",
    now() as "CreatedAt"
  from public."Users" u;

  return new;
end;
$$;

-- Recreate trigger safely

drop trigger if exists trg_notify_users_on_event_insert on public."Events";

create trigger trg_notify_users_on_event_insert
after insert on public."Events"
for each row
execute function public.notify_users_on_event_insert();

commit;
