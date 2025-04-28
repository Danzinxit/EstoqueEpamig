-- Remover políticas existentes de deleção
DROP POLICY IF EXISTS "Admin can delete users" ON auth.users;
DROP POLICY IF EXISTS "Permitir admins deletarem perfis" ON profiles;

-- Criar função auxiliar para verificar se é admin
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

-- Criar política para permitir que admins deletem usuários
CREATE POLICY "Admin can delete users"
ON auth.users FOR DELETE
TO authenticated
USING (public.is_admin());

-- Criar política para permitir que admins deletem perfis
CREATE POLICY "Admin can delete profiles"
ON profiles FOR DELETE
TO authenticated
USING (public.is_admin());

-- Garantir permissões corretas
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin TO authenticated;

-- Criar função RPC para deletar usuário de forma segura
CREATE OR REPLACE FUNCTION delete_user_safely(user_id_to_delete uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verificar se o usuário que está chamando é admin
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Apenas administradores podem deletar usuários';
    END IF;

    -- Deletar o perfil primeiro
    DELETE FROM public.profiles WHERE id = user_id_to_delete;
    
    -- Deletar o usuário do auth
    DELETE FROM auth.users WHERE id = user_id_to_delete;
END;
$$;

-- Garantir que a função RPC pode ser chamada por usuários autenticados
GRANT EXECUTE ON FUNCTION delete_user_safely TO authenticated; 