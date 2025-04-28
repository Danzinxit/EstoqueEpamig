-- Habilitar RLS na tabela auth.users
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Adicionar política para permitir que admins deletem usuários
DROP POLICY IF EXISTS "Admin can delete users" ON auth.users;

CREATE POLICY "Admin can delete users"
  ON auth.users FOR DELETE
  USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- Adicionar política para permitir que admins atualizem usuários
DROP POLICY IF EXISTS "Admin can update users" ON auth.users;

CREATE POLICY "Admin can update users"
  ON auth.users FOR UPDATE
  USING (
    auth.jwt() ->> 'role' = 'admin'
  )
  WITH CHECK (
    auth.jwt() ->> 'role' = 'admin'
  ); 