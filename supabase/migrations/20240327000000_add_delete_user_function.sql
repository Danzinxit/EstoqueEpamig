-- Criar função segura para deletar usuários
CREATE OR REPLACE FUNCTION delete_user_safely(user_id_to_delete uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    calling_user_role text;
    calling_user_id uuid;
BEGIN
    -- Capturar informações para debug
    calling_user_id := auth.uid();
    
    RAISE NOTICE 'Tentativa de deleção - User ID chamando: %, User ID para deletar: %', 
                 calling_user_id, user_id_to_delete;

    -- Verificar role do usuário
    SELECT role INTO calling_user_role
    FROM profiles
    WHERE id = calling_user_id;
    
    RAISE NOTICE 'Role do usuário chamando: %', calling_user_role;

    IF calling_user_role != 'admin' THEN
        RAISE EXCEPTION 'Apenas administradores podem deletar usuários. Role atual: %', calling_user_role;
    END IF;

    -- Deletar registros
    DELETE FROM public.profiles WHERE id = user_id_to_delete;
    DELETE FROM auth.users WHERE id = user_id_to_delete;
    
    RAISE NOTICE 'Usuário deletado com sucesso';
END;
$$;

-- Dar permissão para usuários autenticados chamarem a função
GRANT EXECUTE ON FUNCTION delete_user_safely TO authenticated;

-- Criar política para permitir que admins deletem perfis
DROP POLICY IF EXISTS "Permitir admins deletarem perfis" ON public.profiles;

CREATE POLICY "Permitir admins deletarem perfis"
ON public.profiles
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
        AND role = 'admin'
    )
);

-- Garantir que RLS está habilitado
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY; 