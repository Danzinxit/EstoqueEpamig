-- Criar a tabela profiles se ela não existir
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Criar políticas de acesso
CREATE POLICY "Permitir leitura para usuários autenticados"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Permitir atualização para admins"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Criar função para atualizar o timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar trigger para atualizar o timestamp
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Garantir que o usuário atual tenha a role correta
UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
    raw_app_meta_data,
    '{role}',
    '"admin"'
)
WHERE email = 'daniel.silva@epamig.br';

-- Inserir ou atualizar o perfil do usuário
INSERT INTO public.profiles (id, email, name, role)
SELECT 
    id,
    email,
    email as name,
    'admin' as role
FROM auth.users
WHERE email = 'daniel.silva@epamig.br'
ON CONFLICT (id) DO UPDATE
SET role = 'admin', email = EXCLUDED.email; 