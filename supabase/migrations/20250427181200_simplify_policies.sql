-- Remover TODAS as políticas existentes da tabela profiles
DO $$ 
BEGIN
  -- Deletar todas as políticas existentes
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'profiles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', pol.policyname);
  END LOOP;
END $$;

-- Resetar as configurações de RLS
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Garantir que a coluna role existe e tem o tipo correto
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role text DEFAULT 'user';
  END IF;
END $$;

-- Garantir que a coluna active existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'active'
  ) THEN
    ALTER TABLE profiles ADD COLUMN active boolean DEFAULT true;
  END IF;
END $$;

-- Criar novas políticas simplificadas
-- 1. Permitir leitura para todos os usuários autenticados
CREATE POLICY "profiles_read_policy" ON profiles
FOR SELECT TO authenticated
USING (true);

-- 2. Permitir todas as operações para admins
CREATE POLICY "profiles_admin_policy" ON profiles
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (
      auth.users.raw_app_meta_data->>'role' = 'admin'
      OR auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  )
);

-- 3. Permitir que usuários atualizem seus próprios perfis
CREATE POLICY "profiles_update_own_policy" ON profiles
FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 4. Permitir inserção durante signup
CREATE POLICY "profiles_insert_policy" ON profiles
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

-- Garantir permissões necessárias
GRANT USAGE ON SCHEMA public TO authenticated, anon, service_role;
GRANT ALL ON profiles TO authenticated, service_role;
GRANT USAGE ON SCHEMA auth TO authenticated, anon, service_role;

-- Revogar permissões desnecessárias
REVOKE ALL ON profiles FROM anon;

-- Verificar e corrigir sequências se necessário
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.sequences 
    WHERE sequence_name = 'profiles_id_seq'
  ) THEN
    GRANT USAGE, SELECT ON SEQUENCE profiles_id_seq TO authenticated, service_role;
  END IF;
END $$; 