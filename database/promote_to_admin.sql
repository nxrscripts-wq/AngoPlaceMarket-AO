-- ============================================================================
-- SCRIPT PARA PROMOVER UTILIZADOR A ADMINISTRADOR
-- ============================================================================
-- Instruções:
-- 1. Certifique-se que o utilizador já criou conta na aplicação (Sign Up).
-- 2. Execute este script no Editor SQL do Supabase.
-- ============================================================================

-- 1. Definir o email do utilizador a promover
DO $$
DECLARE
  target_email TEXT := 'elviinojf69@gmail.com';
BEGIN
  -- 2. Atualizar a tabela de perfis
  UPDATE public.profiles
  SET role = 'ADMIN'
  WHERE email = target_email;

  -- 3. Confirmar se encontrou e atualizou
  IF FOUND THEN
    RAISE NOTICE 'Utilizador % promovido a ADMIN com sucesso.', target_email;
  ELSE
    RAISE NOTICE 'AVISO: Utilizador % não encontrado. Certifique-se que ele já fez o registo na App.', target_email;
  END IF;
END $$;

-- 4. Verificar o resultado
SELECT email, role, full_name FROM public.profiles WHERE email = 'elviinojf69@gmail.com';
