-- Seed Reservations from existing Events
-- Binds old Events to Rooms by matching: Rooms.Name == Events.Location
-- Default duration: 2 hours. You can change the interval if you want.
-- Safe-ish to re-run: skips events that already have a reservation.

INSERT INTO "public"."Reservations" ("RoomId", "EventId", "StartTime", "EndTime", "Status")
SELECT
  r."Id"       AS "RoomId",
  e."Id"       AS "EventId",
  e."Time"     AS "StartTime",
  e."Time" + interval '2 hours' AS "EndTime",
  1            AS "Status"  -- Approved
FROM "public"."Events" e
JOIN "public"."Rooms" r
  ON r."Name" = e."Location"
WHERE e."Id" IN (
  2,3,4,5,
  42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67
)
AND NOT EXISTS (
  SELECT 1
  FROM "public"."Reservations" res
  WHERE res."EventId" = e."Id"
);

-- If some Events.Location values don't have a matching Room.Name, add them to seed_rooms.sql
-- (or create a manual mapping and insert accordingly).
