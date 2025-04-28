-- Criar função para deletar usuário
CREATE OR REPLACE FUNCTION delete_user(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_admin boolean;
BEGIN
  -- Verificar se o usuário que está chamando a função é admin
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  ) INTO is_admin;

  IF NOT is_admin THEN
    RAISE EXCEPTION 'Apenas administradores podem deletar usuários';
  END IF;

  -- Deletar o perfil
  DELETE FROM public.profiles WHERE id = user_id;
  
  -- Deletar o usuário do auth
  DELETE FROM auth.users WHERE id = user_id;
END;
$$;

-- Dar permissão para admins executarem a função
GRANT EXECUTE ON FUNCTION delete_user TO authenticated; 