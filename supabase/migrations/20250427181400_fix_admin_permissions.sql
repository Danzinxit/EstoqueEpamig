-- Remover políticas existentes
DROP POLICY IF EXISTS "profiles_read_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_admin_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;

-- Resetar RLS
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Função auxiliar para verificar se é admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (
        auth.users.raw_app_meta_data->>'role' = 'admin'
        OR auth.users.raw_user_meta_data->>'role' = 'admin'
      )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar novas políticas
-- 1. Política de leitura geral
CREATE POLICY "Enable read access for all authenticated users"
ON profiles FOR SELECT
TO authenticated
USING (true);

-- 2. Política de administrador (todas as operações)
CREATE POLICY "Enable full access for admins"
ON profiles FOR ALL
TO authenticated
USING (public.is_admin());

-- 3. Política de atualização própria
CREATE POLICY "Enable self update"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 4. Política de inserção
CREATE POLICY "Enable insert for admins and service role"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin() 
  OR auth.uid() = id 
  OR auth.role() = 'service_role'
);

-- Garantir permissões corretas
GRANT USAGE ON SCHEMA public TO authenticated, service_role;
GRANT ALL ON profiles TO authenticated, service_role;
GRANT USAGE ON SCHEMA auth TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin TO authenticated, service_role;

-- Revogar permissões desnecessárias
REVOKE ALL ON profiles FROM anon; 