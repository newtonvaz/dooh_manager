-- Function to delete old activities, keeping only the latest N
create or replace function delete_old_activities(keep_count int)
returns void
language plpgsql
as $$
begin
  delete from activities
  where id not in (
    select id from activities
    order by timestamp desc
    limit keep_count
  );
end;
$$;
