-- Criar função para criar perfil de usuário
CREATE OR REPLACE FUNCTION create_user_profile(
  user_id UUID,
  user_email TEXT,
  user_full_name TEXT,
  user_role TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Executa com os privilégios do criador da função
SET search_path = public
AS $$
BEGIN
  -- Verificar se o usuário que está chamando é admin
  IF NOT EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_app_meta_data->>'role' = 'admin'
  ) THEN
    RAISE EXCEPTION 'Apenas administradores podem criar perfis';
  END IF;

  -- Confirmar o email do usuário automaticamente
  UPDATE auth.users 
  SET email_confirmed_at = NOW(),
      updated_at = NOW()
  WHERE id = user_id;

  -- Inserir o perfil
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    created_at,
    updated_at
  ) VALUES (
    user_id,
    user_email,
    user_full_name,
    user_role,
    NOW(),
    NOW()
  );
END;
$$;

-- Remover política antiga se existir
DROP POLICY IF EXISTS "Permitir chamada RPC para admins" ON public.profiles;

-- Criar nova política correta para INSERT
CREATE POLICY "Permitir chamada RPC para admins"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_app_meta_data->>'role' = 'admin'
  )
);

-- Garantir que RLS está habilitado
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY; 