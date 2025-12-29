-- ==========================================
-- MIGRACIÓN: Autenticación Obligatoria para Contactos
-- ==========================================
-- Fecha: 2025-12-08
-- Propósito: Crear tabla contact_messages con autenticación obligatoria

-- PASO 1: Crear tabla contact_messages
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referencias
  ad_id UUID NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  ad_owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Datos del remitente
  sender_name TEXT NOT NULL,
  sender_last_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  sender_phone TEXT NOT NULL,
  
  -- Mensaje
  message TEXT NOT NULL,
  
  -- Metadata
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PASO 2: Habilitar RLS
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- PASO 3: Crear índice para consultas de mensajes enviados (performance)
CREATE INDEX IF NOT EXISTS idx_contact_messages_sender 
  ON public.contact_messages(sender_user_id, created_at DESC);

-- PASO 4: Crear índice para mensajes recibidos
CREATE INDEX IF NOT EXISTS idx_contact_messages_receiver 
  ON public.contact_messages(ad_owner_id, created_at DESC);

-- PASO 5: Crear índice para búsqueda por aviso
CREATE INDEX IF NOT EXISTS idx_contact_messages_ad 
  ON public.contact_messages(ad_id, created_at DESC);

-- PASO 6: RLS Policy - Solo usuarios autenticados pueden insertar
DROP POLICY IF EXISTS "Users can send contacts" ON public.contact_messages;
DROP POLICY IF EXISTS "Authenticated users can send contacts" ON public.contact_messages;

CREATE POLICY "Authenticated users can send contacts"
  ON public.contact_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_user_id = auth.uid()
  );

-- PASO 7: RLS Policy - Ver mensajes enviados/recibidos
DROP POLICY IF EXISTS "Users can view their contacts" ON public.contact_messages;
DROP POLICY IF EXISTS "Users can view their sent/received contacts" ON public.contact_messages;

CREATE POLICY "Users can view their sent/received contacts"
  ON public.contact_messages
  FOR SELECT
  TO authenticated
  USING (
    sender_user_id = auth.uid() OR 
    ad_owner_id = auth.uid()
  );

-- PASO 8: RLS Policy - Usuarios pueden actualizar sus mensajes recibidos (marcar como leído)
DROP POLICY IF EXISTS "Users can update received messages" ON public.contact_messages;

CREATE POLICY "Users can update received messages"
  ON public.contact_messages
  FOR UPDATE
  TO authenticated
  USING (ad_owner_id = auth.uid())
  WITH CHECK (ad_owner_id = auth.uid());

-- PASO 9: Verificar estructura final
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'contact_messages'
  AND column_name IN ('sender_user_id', 'sender_last_name', 'sender_phone')
ORDER BY ordinal_position;

-- Resultado esperado:
-- sender_user_id   | uuid    | NO
-- sender_last_name | text    | NO
-- sender_phone     | text    | NO

-- ==========================================
-- ROLLBACK (si algo sale mal)
-- ==========================================
-- Para revertir los cambios (CUIDADO: elimina la tabla completa):
/*
DROP TABLE IF EXISTS public.contact_messages CASCADE;
*/
