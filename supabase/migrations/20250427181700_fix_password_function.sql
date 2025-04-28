-- Habilitar a extensão pgcrypto se ainda não estiver habilitada
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Criar função segura para alterar senha
CREATE OR REPLACE FUNCTION change_user_password(target_user_id uuid, new_password text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    is_admin boolean;
BEGIN
    -- Verificar se o usuário que está chamando é admin
    SELECT EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid()
        AND (
            raw_app_meta_data->>'role' = 'admin'
            OR raw_user_meta_data->>'role' = 'admin'
        )
    ) INTO is_admin;

    IF NOT is_admin THEN
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

-- Garantir que as permissões necessárias estão configuradas
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT UPDATE ON auth.users TO authenticated; 