-- Adicionar política para permitir que admins deletem perfis
DROP POLICY IF EXISTS "Admin can delete profiles" ON profiles;

CREATE POLICY "Admin can delete profiles"
  ON profiles FOR DELETE
  USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- Adicionar política para permitir que admins atualizem perfis
DROP POLICY IF EXISTS "Admin can update profiles" ON profiles;

CREATE POLICY "Admin can update profiles"
  ON profiles FOR UPDATE
  USING (
    auth.jwt() ->> 'role' = 'admin'
  )
  WITH CHECK (
    auth.jwt() ->> 'role' = 'admin'
  ); 