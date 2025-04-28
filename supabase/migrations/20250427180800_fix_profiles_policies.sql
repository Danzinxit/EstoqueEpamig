-- Remover políticas existentes
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can manage profiles" ON profiles;

-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Criar novas políticas
-- Permitir que usuários autenticados vejam todos os perfis
CREATE POLICY "Authenticated users can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (true);

-- Permitir que admins gerenciem todos os perfis
CREATE POLICY "Admin can manage all profiles"
ON profiles FOR ALL
USING (
  auth.jwt() ->> 'role' = 'admin' OR 
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND (
      raw_app_meta_data->>'role' = 'admin' OR
      raw_user_meta_data->>'role' = 'admin'
    )
  )
);

-- Permitir que o trigger de autenticação crie perfis
CREATE POLICY "Enable insert for authentication trigger"
ON profiles FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Permitir que usuários atualizem seu próprio perfil
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Garantir que o schema auth está disponível
GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated, service_role;

-- Garantir que as funções de autenticação estão disponíveis
GRANT EXECUTE ON FUNCTION auth.role() TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION auth.jwt() TO postgres, anon, authenticated, service_role; 