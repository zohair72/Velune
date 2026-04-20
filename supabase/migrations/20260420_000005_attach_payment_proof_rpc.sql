create or replace function public.attach_order_payment_proof(
  p_order_id uuid,
  p_order_number text,
  p_payment_proof_path text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows_updated integer := 0;
begin
  if p_order_id is null then
    raise exception 'Order id is required.';
  end if;

  if coalesce(trim(p_order_number), '') = '' then
    raise exception 'Order number is required.';
  end if;

  if coalesce(trim(p_payment_proof_path), '') = '' then
    raise exception 'Payment proof path is required.';
  end if;

  update public.orders
  set payment_proof_path = trim(p_payment_proof_path)
  where id = p_order_id
    and order_number = trim(p_order_number)
    and payment_method = 'Manual Payment';

  get diagnostics v_rows_updated = row_count;

  return v_rows_updated > 0;
end;
$$;

grant execute on function public.attach_order_payment_proof(
  uuid,
  text,
  text
) to anon, authenticated, service_role;
