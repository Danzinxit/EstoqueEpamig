-- Primeiro, vamos criar o usuário no auth.users
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
  'estefaestafane.oliveira@epamig.br',
  crypt('Epamig@2024', gen_salt('bf')), -- Senha inicial: Epamig@2024
  now(),
  '{"provider":"email","providers":["email"],"role":"user"}',
  '{"full_name":"Estefânia Oliveira","role":"user"}',
  now()
)
RETURNING id;

-- Em seguida, vamos criar o perfil na tabela profiles
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
  'estefaestafane.oliveira@epamig.br',
  'Estefânia Oliveira',
  'user',
  now(),
  now()
FROM auth.users
WHERE email = 'estefaestafane.oliveira@epamig.br';

-- Sincronizar os metadados do usuário
SELECT auth.role() FROM auth.users WHERE email = 'estefaestafane.oliveira@epamig.br'; 