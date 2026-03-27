do $$
declare
  v_user_id int;
begin
  -- マスターユーザーをメールアドレス基準で作成する
  insert into public.users (
    user_name,
    email,
    phone_number,
    postal_code,
    prefecture,
    street_address,
    building_name,
    birth_date,
    current_attendance_state,
    current_attendance_id,
    assignment_date
  )
  select
    'マスターユーザー',
    'master@example.com',
    '09012345678',
    '1500001',
    '東京都',
    '渋谷区神宮前1-2-3',
    'サンプルビル 5F',
    date '1990-04-01',
    null,
    null,
    date '2025-04-01'
  where not exists (
    select 1
    from public.users
    where email = 'master@example.com'
  )
  returning id into v_user_id;

  -- 既存ユーザーだった場合は user_id を取り直す
  if v_user_id is null then
    select id
    into v_user_id
    from public.users
    where email = 'master@example.com';
  end if;

  -- 認証情報が未作成なら作成する
  insert into public.auth (
    user_id,
    password
  )
  select
    v_user_id,
    'abc123'
  where not exists (
    select 1
    from public.auth
    where user_id = v_user_id
  );
end
$$;
