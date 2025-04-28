-- Adicionar coluna active na tabela profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;

-- Atualizar todos os registros existentes para active = true
UPDATE profiles
SET active = TRUE
WHERE active IS NULL; 