-- Remover políticas existentes
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can manage profiles" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authentication trigger" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Adicionar coluna active se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'active'
  ) THEN
    ALTER TABLE profiles ADD COLUMN active boolean DEFAULT true;
  END IF;
END $$;

-- Criar novas políticas mais permissivas
-- Permitir que usuários autenticados vejam todos os perfis ativos
CREATE POLICY "View active profiles"
ON profiles FOR SELECT
TO authenticated
USING (active = true OR auth.uid() = id);

-- Permitir que admins gerenciem todos os perfis
CREATE POLICY "Admin full access"
ON profiles FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND (
      raw_app_meta_data->>'role' = 'admin' OR
      raw_user_meta_data->>'role' = 'admin'
    )
  )
);

-- Permitir que o sistema crie novos perfis durante o signup
CREATE POLICY "System can create profiles"
ON profiles FOR INSERT
WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated');

-- Permitir que usuários atualizem seus próprios perfis
CREATE POLICY "Self profile update"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Garantir que as funções necessárias estão disponíveis
GRANT USAGE ON SCHEMA auth TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION auth.role() TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION auth.jwt() TO authenticated, anon, service_role;

-- Garantir que a tabela profiles está acessível
GRANT ALL ON profiles TO authenticated, anon, service_role; 