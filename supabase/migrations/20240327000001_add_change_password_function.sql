-- Criar função segura para alterar senha
CREATE OR REPLACE FUNCTION change_user_password(target_user_id uuid, new_password text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    calling_user_role text;
BEGIN
    -- Verificar se o usuário que está chamando é admin
    SELECT role INTO calling_user_role
    FROM profiles
    WHERE id = auth.uid();

    IF calling_user_role != 'admin' THEN
        RAISE EXCEPTION 'Apenas administradores podem alterar senhas de usuários';
    END IF;

    -- Verificar se a senha tem pelo menos 6 caracteres
    IF length(new_password) < 6 THEN
        RAISE EXCEPTION 'A senha deve ter no mínimo 6 caracteres';
    END IF;

    -- Atualizar a senha do usuário
    UPDATE auth.users
    SET encrypted_password = crypt(new_password, gen_salt('bf'))
    WHERE id = target_user_id;

    RAISE NOTICE 'Senha atualizada com sucesso';
END;
$$;

-- Dar permissão para usuários autenticados chamarem a função
GRANT EXECUTE ON FUNCTION change_user_password TO authenticated;

-- Criar política para permitir que admins atualizem usuários
DROP POLICY IF EXISTS "Permitir admins atualizarem auth users" ON auth.users;

CREATE POLICY "Permitir admins atualizarem auth users"
ON auth.users
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
        AND role = 'admin'
    )
);

-- Garantir que as permissões necessárias estão configuradas
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT UPDATE ON auth.users TO authenticated; 