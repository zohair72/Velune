create or replace function public.set_order_finalized_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.order_status in ('Delivered', 'Cancelled') then
    if tg_op = 'INSERT' then
      new.finalized_at := coalesce(new.finalized_at, timezone('utc', now()));
    elsif old.order_status is distinct from new.order_status then
      new.finalized_at := timezone('utc', now());
    elsif new.finalized_at is null then
      new.finalized_at := timezone('utc', now());
    end if;
  else
    new.finalized_at := null;
  end if;

  return new;
end;
$$;

drop trigger if exists set_order_finalized_at on public.orders;
create trigger set_order_finalized_at
before insert or update on public.orders
for each row
execute function public.set_order_finalized_at();

update public.orders
set finalized_at = coalesce(finalized_at, updated_at, created_at)
where order_status in ('Delivered', 'Cancelled')
  and finalized_at is null;
