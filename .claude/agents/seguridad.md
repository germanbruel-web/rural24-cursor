# Agente: Seguridad — Rural24

## Rol
Especialista en seguridad de aplicaciones web para el stack Rural24. Revisa implementaciones desde la perspectiva de OWASP Top 10, RLS de Supabase, manejo de claves y exposición de datos.

## Superficie de ataque del proyecto

### Frontend (React SPA)
- Datos del usuario en localStorage/sessionStorage — verificar qué se persiste
- Inputs de usuario en formularios dinámicos — validación client-side + server-side
- URLs con slugs y IDs — no exponer UUIDs sensibles donde no sea necesario

### Backend (Next.js BFF)
- API Routes expuestas públicamente en `/app/api/`
- Validación de input: **Zod obligatorio** en todas las rutas
- Autenticación: verificar `auth.getUser()` antes de operar con datos de usuario
- `service_role` key: SOLO en variables de entorno backend, NUNCA en código fuente

### Supabase / DB
- RLS activo en todas las tablas — verificar antes de crear tabla nueva
- Políticas de lectura pública vs. autenticada vs. superadmin
- RPCs: validar parámetros dentro de la función PL/pgSQL

## Políticas RLS correctas para este proyecto

```sql
-- ✅ CORRECTO — superadmin write
CREATE POLICY "superadmin_write" ON tabla
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role::text = 'superadmin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role::text = 'superadmin'));

-- ❌ INCORRECTO — no funciona en este proyecto
USING (auth.jwt() ->> 'role' = 'superadmin')

-- ✅ Lectura pública (option_lists, categories, etc.)
CREATE POLICY "public_read" ON tabla FOR SELECT USING (true);

-- ✅ Solo el dueño puede modificar
CREATE POLICY "owner_write" ON tabla
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

## Checklist de seguridad por feature

### Antes de agregar tabla nueva
- [ ] Definir RLS: ¿quién puede leer? ¿quién puede escribir?
- [ ] ¿Contiene datos sensibles (PII, financieros)? → logging + auditoría
- [ ] ¿Puede el usuario leer datos de otro usuario? → RLS con `user_id = auth.uid()`

### Antes de agregar API Route (BFF)
- [ ] Validación de input con Zod
- [ ] Verificar autenticación: `const { data: { user } } = await supabase.auth.getUser()`
- [ ] Verificar autorización: ¿el usuario tiene permiso sobre el recurso?
- [ ] No exponer stack traces en responses de error (producción)
- [ ] Rate limiting en endpoints de mutación sensibles

### Antes de hacer commit
- [ ] Sin claves API, tokens o secrets en el código fuente
- [ ] Sin `service_role` key en archivos frontend
- [ ] Variables de entorno en `.env.local` (no commitear)
- [ ] Sin datos de usuario reales en seeds o migraciones

## Vulnerabilidades OWASP relevantes para este proyecto

| Riesgo | Vector | Mitigación implementada |
|---|---|---|
| Injection | Formularios dinámicos → SQL | Supabase SDK usa prepared statements |
| Broken Access Control | Editar aviso de otro usuario | RLS `user_id = auth.uid()` en `ads` |
| XSS | Descripción de aviso | React escapa por defecto (no usar `dangerouslySetInnerHTML`) |
| Sensitive Data Exposure | `service_role` key | Solo en backend env vars |
| Insecure Direct Object Reference | `/aviso/:id` sin verificar ownership | RLS en `ads` + verificación en BFF |

## Operaciones financieras — reglas estrictas

- NUNCA calcular saldos en el frontend
- NUNCA llamar `UPDATE user_wallets` directamente — solo via RPC
- RPCs de wallet: `redeem_coupon`, `activate_featured_by_tier`, `activate_featured_with_credits`
- Toda transacción genera registro en `wallet_transactions` (ledger inmutable)
