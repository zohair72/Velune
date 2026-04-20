create or replace function public.normalize_pakistan_phone_number(p_phone text)
returns text
language plpgsql
immutable
set search_path = public
as $$
declare
  v_digits text;
begin
  if p_phone is null then
    return null;
  end if;

  v_digits := regexp_replace(p_phone, '\D', '', 'g');

  if v_digits = '' then
    return null;
  end if;

  if left(v_digits, 2) = '00' then
    v_digits := substr(v_digits, 3);
  end if;

  if v_digits ~ '^923\d{9}$' then
    return v_digits;
  end if;

  if v_digits ~ '^03\d{9}$' then
    return '92' || substr(v_digits, 2);
  end if;

  if v_digits ~ '^3\d{9}$' then
    return '92' || v_digits;
  end if;

  return null;
end;
$$;

create or replace function public.create_order_with_items(
  p_order_number text,
  p_customer_name text,
  p_phone text,
  p_email text,
  p_address text,
  p_city text,
  p_notes text,
  p_payment_method text,
  p_payment_status text,
  p_order_status text,
  p_subtotal numeric,
  p_items jsonb
)
returns table (
  id uuid,
  order_number text,
  payment_status text,
  order_status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item jsonb;
  v_product_id uuid;
  v_product_name text;
  v_quantity integer;
  v_unit_price numeric(10, 2);
  v_line_total numeric(10, 2);
  v_available_stock integer;
  v_created_order_id uuid;
  v_created_order_number text;
  v_created_payment_status text;
  v_created_order_status text;
  v_payment_method text;
  v_payment_status text;
  v_order_status text;
  v_phone_normalized text;
begin
  if coalesce(trim(p_order_number), '') = '' then
    raise exception 'Order number is required.';
  end if;

  if coalesce(trim(p_customer_name), '') = '' then
    raise exception 'Customer name is required.';
  end if;

  if coalesce(trim(p_phone), '') = '' then
    raise exception 'Phone number is required.';
  end if;

  if coalesce(trim(p_address), '') = '' then
    raise exception 'Address is required.';
  end if;

  if coalesce(trim(p_city), '') = '' then
    raise exception 'City is required.';
  end if;

  if p_items is null
    or jsonb_typeof(p_items) <> 'array'
    or jsonb_array_length(p_items) = 0
  then
    raise exception 'At least one order item is required.';
  end if;

  v_phone_normalized := public.normalize_pakistan_phone_number(p_phone);

  if v_phone_normalized is null then
    raise exception 'A valid Pakistan mobile number is required.';
  end if;

  v_payment_method := case lower(trim(p_payment_method))
    when 'cod' then 'Cash on Delivery'
    when 'cash on delivery' then 'Cash on Delivery'
    when 'manual_payment' then 'Manual Payment'
    when 'manual transfer' then 'Manual Payment'
    when 'manual_transfer' then 'Manual Payment'
    when 'manual payment' then 'Manual Payment'
    else trim(p_payment_method)
  end;

  v_payment_status := case lower(trim(p_payment_status))
    when 'cod' then 'COD'
    when 'not_required' then 'COD'
    when 'pending' then 'Pending'
    when 'received' then 'Received'
    when 'failed' then 'Failed'
    else trim(p_payment_status)
  end;

  v_order_status := case lower(trim(p_order_status))
    when 'new' then 'New'
    when 'awaiting_payment' then 'Awaiting Payment'
    when 'payment_received' then 'Payment Received'
    when 'processing' then 'Processing'
    when 'packed' then 'Packed'
    when 'shipped' then 'Shipped'
    when 'delivered' then 'Delivered'
    when 'cancelled' then 'Cancelled'
    else trim(p_order_status)
  end;

  for v_item in
    select value
    from jsonb_array_elements(p_items)
  loop
    v_product_id := nullif(trim(v_item->>'product_id'), '')::uuid;
    v_product_name := nullif(trim(v_item->>'product_name'), '');
    v_quantity := coalesce((v_item->>'quantity')::integer, 0);
    v_unit_price := coalesce((v_item->>'unit_price')::numeric, 0);
    v_line_total := coalesce((v_item->>'line_total')::numeric, 0);

    if v_product_id is null then
      raise exception 'Each order item must include a product_id.';
    end if;

    if v_product_name is null then
      raise exception 'Each order item must include a product_name.';
    end if;

    if v_quantity <= 0 then
      raise exception 'Each order item quantity must be greater than zero.';
    end if;

    if v_unit_price < 0 or v_line_total < 0 then
      raise exception 'Order item pricing must be zero or greater.';
    end if;

    select inventory_product.stock_quantity
    into v_available_stock
    from public.products as inventory_product
    where inventory_product.id = v_product_id
      and inventory_product.is_active = true
    for update;

    if not found then
      raise exception 'Product not found or inactive: %', v_product_name;
    end if;

    if v_available_stock < v_quantity then
      raise exception 'Insufficient stock for % (available: %, requested: %)',
        v_product_name, v_available_stock, v_quantity;
    end if;
  end loop;

  insert into public.orders (
    order_number,
    customer_name,
    phone,
    phone_normalized,
    email,
    address,
    city,
    notes,
    payment_method,
    payment_status,
    order_status,
    subtotal
  )
  values (
    trim(p_order_number),
    trim(p_customer_name),
    trim(p_phone),
    v_phone_normalized,
    nullif(trim(p_email), ''),
    trim(p_address),
    trim(p_city),
    nullif(trim(p_notes), ''),
    v_payment_method,
    v_payment_status,
    v_order_status,
    coalesce(p_subtotal, 0)
  )
  returning
    public.orders.id,
    public.orders.order_number,
    public.orders.payment_status,
    public.orders.order_status
  into
    v_created_order_id,
    v_created_order_number,
    v_created_payment_status,
    v_created_order_status;

  for v_item in
    select value
    from jsonb_array_elements(p_items)
  loop
    v_product_id := (v_item->>'product_id')::uuid;
    v_product_name := trim(v_item->>'product_name');
    v_quantity := (v_item->>'quantity')::integer;
    v_unit_price := (v_item->>'unit_price')::numeric;
    v_line_total := (v_item->>'line_total')::numeric;

    insert into public.order_items (
      order_id,
      product_id,
      product_name,
      quantity,
      unit_price,
      line_total
    )
    values (
      v_created_order_id,
      v_product_id,
      v_product_name,
      v_quantity,
      v_unit_price,
      v_line_total
    );

    update public.products as inventory_product
    set stock_quantity = inventory_product.stock_quantity - v_quantity
    where inventory_product.id = v_product_id;
  end loop;

  return query
  select
    v_created_order_id,
    v_created_order_number,
    v_created_payment_status,
    v_created_order_status;
end;
$$;

create or replace function public.track_order_by_number_and_phone(
  p_order_number text,
  p_phone text
)
returns table (
  order_number text,
  customer_name text,
  city text,
  payment_method text,
  payment_status text,
  order_status text,
  subtotal numeric,
  created_at timestamptz,
  items jsonb
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phone_normalized text;
begin
  if coalesce(trim(p_order_number), '') = '' then
    raise exception 'Order number is required.';
  end if;

  v_phone_normalized := public.normalize_pakistan_phone_number(p_phone);

  if v_phone_normalized is null then
    raise exception 'A valid Pakistan mobile number is required.';
  end if;

  return query
  select
    matching_order.order_number,
    matching_order.customer_name,
    matching_order.city,
    matching_order.payment_method,
    matching_order.payment_status,
    matching_order.order_status,
    matching_order.subtotal,
    matching_order.created_at,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'product_name', order_item.product_name,
            'quantity', order_item.quantity,
            'unit_price', order_item.unit_price,
            'line_total', order_item.line_total
          )
          order by order_item.created_at nulls last, order_item.id
        )
        from public.order_items as order_item
        where order_item.order_id = matching_order.id
      ),
      '[]'::jsonb
    ) as items
  from public.orders as matching_order
  where matching_order.order_number = trim(p_order_number)
    and coalesce(
      matching_order.phone_normalized,
      public.normalize_pakistan_phone_number(matching_order.phone)
    ) = v_phone_normalized
  order by matching_order.created_at desc
  limit 1;
end;
$$;

grant execute on function public.normalize_pakistan_phone_number(text)
to anon, authenticated, service_role;

grant execute on function public.create_order_with_items(
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  numeric,
  jsonb
)
to anon, authenticated, service_role;

grant execute on function public.track_order_by_number_and_phone(
  text,
  text
)
to anon, authenticated, service_role;
