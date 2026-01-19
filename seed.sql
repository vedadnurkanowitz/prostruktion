-- Seed Script for Super Admin
-- This is a bit tricky because we need to insert into auth.users which is usually protected.
-- RUN THIS IN THE SUPABASE SQL EDITOR.

DO $$
DECLARE
  new_user_id uuid := uuid_generate_v4();
BEGIN
  -- 1. Insert into auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    new_user_id,
    'authenticated',
    'authenticated',
    'mihmic.adnan@gmail.com',
    crypt('Nanda_2991', gen_salt('bf')), -- Password encryption
    now(),
    now(),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Super Admin"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  -- 2. Insert into public.profiles (Trigger usually handles this, but we force role here)
  -- If the trigger is enabled, it might create a profile with 'broker' role. 
  -- We'll try to update it or insert if the trigger didn't run.
  
  INSERT INTO public.profiles (id, email, role, full_name)
  VALUES (new_user_id, 'mihmic.adnan@gmail.com', 'super_admin', 'Super Admin')
  ON CONFLICT (id) DO UPDATE
  SET role = 'super_admin';

END $$;
