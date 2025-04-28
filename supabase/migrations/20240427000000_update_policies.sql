-- Atualizar políticas da tabela profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Permitir leitura para usuários autenticados
CREATE POLICY "Permitir leitura de perfis para usuários autenticados"
ON profiles FOR SELECT
TO authenticated
USING (true);

-- Permitir inserção apenas para admins
CREATE POLICY "Permitir inserção de perfis para admins"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Permitir atualização apenas para admins
CREATE POLICY "Permitir atualização de perfis para admins"
ON profiles FOR UPDATE
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin')
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Permitir deleção apenas para admins
CREATE POLICY "Permitir deleção de perfis para admins"
ON profiles FOR DELETE
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin'); 