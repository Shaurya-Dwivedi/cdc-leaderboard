-- ONE-OFF: only for a database that ran the ORIGINAL schema and has no real data yet.
-- Deletes the 22 fake demo members (m-4 .. m-25) and, via cascade, any points, results
-- and rewards attached to them. Run it once, in the Supabase SQL editor, after schema.sql.
-- Do NOT run it once real members exist with ids in this range (members added in the app
-- get 'm-<uuid>' ids and are not affected).
delete from members
where id in (
  'm-4','m-5','m-6','m-7','m-8','m-9','m-10','m-11','m-12','m-13','m-14','m-15','m-16',
  'm-17','m-18','m-19','m-20','m-21','m-22','m-23','m-24','m-25'
);
