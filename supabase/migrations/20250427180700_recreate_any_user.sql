-- Substitua os valores entre < > pelos dados do usuário que deseja criar
-- Por exemplo: substitua <email> por 'usuario@epamig.br'

DO $$
DECLARE
    v_user_id uuid;
BEGIN
    -- Pegar o ID do usuário se ele existir
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = '<email>';

    -- Se o usuário existir, deletar primeiro o perfil e depois o usuário
    IF v_user_id IS NOT NULL THEN
        DELETE FROM public.profiles WHERE id = v_user_id;
        DELETE FROM auth.users WHERE id = v_user_id;
    END IF;
END $$;

-- Agora criar o novo usuário
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  '<email>',
  crypt('<senha>', gen_salt('bf')), -- Substitua <senha> pela senha desejada
  now(),
  '{"provider":"email","providers":["email"],"role":"<role>"}',
  '{"full_name":"<nome_completo>","role":"<role>"}',
  now()
)
RETURNING id;

-- Criar o novo perfil
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  role,
  created_at,
  updated_at
)
SELECT 
  id,
  '<email>',
  '<nome_completo>',
  '<role>',
  now(),
  now()
FROM auth.users
WHERE email = '<email>';

-- Sincronizar os metadados do usuário
SELECT auth.role() FROM auth.users WHERE email = '<email>'; 