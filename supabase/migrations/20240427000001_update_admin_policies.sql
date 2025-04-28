-- Permitir que o serviço de autenticação acesse a tabela de perfis
CREATE POLICY "Permitir acesso do serviço de autenticação"
ON profiles FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Garantir que apenas admins possam usar funções administrativas
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir funções administrativas para admins"
ON auth.users FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin')
WITH CHECK (auth.jwt() ->> 'role' = 'admin'); 