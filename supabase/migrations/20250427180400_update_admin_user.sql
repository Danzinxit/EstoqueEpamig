-- Atualizar o perfil do usuário para admin
UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'daniel.silva@epamig.br';

-- Atualizar a role na tabela de profiles também
UPDATE public.profiles
SET role = 'admin'
WHERE id = (
  SELECT id 
  FROM auth.users 
  WHERE email = 'daniel.silva@epamig.br'
);

-- Sincronizar os metadados do usuário
SELECT auth.role() FROM auth.users WHERE email = 'daniel.silva@epamig.br'; 