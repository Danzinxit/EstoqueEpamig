-- Remover políticas existentes
DROP POLICY IF EXISTS "View active profiles" ON profiles;
DROP POLICY IF EXISTS "Admin full access" ON profiles;
DROP POLICY IF EXISTS "System can create profiles" ON profiles;
DROP POLICY IF EXISTS "Self profile update" ON profiles;

-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Política para permitir que todos os usuários autenticados vejam todos os perfis
CREATE POLICY "Authenticated users can view profiles"
ON profiles FOR SELECT
TO authenticated
USING (true);

-- Política para permitir que admins gerenciem todos os perfis
CREATE POLICY "Admin can manage all profiles"
ON profiles FOR ALL
USING (
  EXISTS (
    SELECT 1 
    FROM auth.users
    WHERE id = auth.uid() 
    AND (
      raw_app_meta_data->>'role' = 'admin' 
      OR raw_user_meta_data->>'role' = 'admin'
    )
  )
);

-- Política para permitir que usuários atualizem seus próprios perfis
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Política para permitir criação de perfis durante signup
CREATE POLICY "Allow profile creation"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (true);

-- Garantir permissões corretas
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA auth TO service_role; 