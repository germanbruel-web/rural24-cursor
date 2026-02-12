# 📧 Solución: Email Rate Limit en Supabase

**Fecha:** 12 Febrero 2026  
**Problema:** "email rate limit exceeded" al registrar usuarios  
**Impacto:** Usuarios no pueden crear cuentas nuevas durante 30-60 minutos

---

## 🔍 Diagnóstico del Problema

### Causa Raíz

Supabase Free Tier tiene **límites estrictos de emails de verificación**:

| Límite | Valor | Descripción |
|--------|-------|-------------|
| **Emails por hora** | 30 | Máximo de emails de verificación enviados por hora |
| **Intentos por IP** | 4-6 | Intentos de registro desde la misma IP |
| **Cooldown** | 30-60 min | Tiempo hasta poder reintentar |

### ¿Por qué pasa?

1. **Testing repetido**: Durante desarrollo, pruebas múltiples agotan el límite
2. **SMTP compartido**: Supabase Free usa servidor SMTP compartido con rate limiting agresivo
3. **Sin SMTP personalizado**: No hay configuración de email corporativo

### Flujo del Error

```
Usuario → Registro → Supabase Auth → Email Service
                                           ↓
                                    Rate Limit Exceeded
                                           ↓
                                    Error: "email rate limit exceeded"
```

---

## ✅ Solución Implementada (Corto Plazo)

### 1. Detección Mejorada del Error

**Archivo:** `frontend/src/services/authService.ts`

```typescript
export interface RegisterResult {
  success: boolean;
  userId?: string;
  needsVerification?: boolean;
  error?: string;
  errorCode?: 'EMAIL_EXISTS' | 'WEAK_PASSWORD' | 'RATE_LIMIT' | 'UNKNOWN';
  //                                              ^^^^^^^^^^^^ NUEVO
}
```

**Detección automática:**

```typescript
if (authError) {
  let errorCode = 'UNKNOWN';
  const errorMsg = authError.message?.toLowerCase() || '';
  
  if (errorMsg.includes('rate limit') || errorMsg.includes('email rate')) {
    errorCode = 'RATE_LIMIT'; // Detectar rate limit específicamente
  }
  
  return { success: false, error: authError.message, errorCode };
}
```

### 2. UX Mejorada

**Archivo:** `frontend/src/components/auth/RegisterForm.tsx`

Cuando `errorCode === 'RATE_LIMIT'`, se muestra:

- ⚠️ **Banner amarillo claro** (no rojo amenazante)
- **Explicación sin jerga técnica**: "Hay un límite temporal por seguridad"
- **3 opciones claras**:
  1. ⏰ Esperar 30-60 minutos
  2. ✅ **Usar Google/Facebook** (recomendado, instantáneo)
  3. 🔑 Iniciar sesión si ya tiene cuenta

### 3. Alternativas Inmediatas

#### Opción A: Login Social (Recomendado)

- ✅ **Google OAuth**: Sin rate limit, instantáneo
- ✅ **Facebook OAuth**: Sin rate limit, instantáneo
- ✅ **Mejor UX**: 1 click vs formulario completo

#### Opción B: Esperar

- ⏰ 30-60 minutos hasta reinicio del límite
- 🔄 Frontend guarda datos en localStorage (no pierden info)

---

## 🚀 Solución Definitiva (Medio Plazo)

### Configurar SMTP Personalizado

**Ventajas:**
- ✅ Sin rate limits de Supabase
- ✅ Mayor control sobre emails
- ✅ Branding personalizado
- ✅ Métricas de entrega

### Proveedores Recomendados

| Proveedor | Plan Gratis | Precio Pago | Recomendación |
|-----------|-------------|-------------|---------------|
| **SendGrid** | 100 emails/día | $15/mes (40K emails) | ⭐⭐⭐⭐⭐ Mejor para startups |
| **AWS SES** | 62K emails/mes | $0.10 por 1000 | ⭐⭐⭐⭐ Mejor precio/volumen |
| **Mailgun** | 100 emails/día | $35/mes (50K emails) | ⭐⭐⭐ Buena deliverability |
| **Resend** | 100 emails/día | $20/mes (50K emails) | ⭐⭐⭐⭐⭐ Moderno, fácil setup |

### Setup SendGrid (Recomendado)

#### Paso 1: Crear cuenta SendGrid

1. Ir a: https://signup.sendgrid.com/
2. Registrarse con email corporativo (preferible)
3. Verificar identidad (tarda 24-48hs)

#### Paso 2: Generar API Key

```bash
# En SendGrid Dashboard:
1. Settings → API Keys
2. Create API Key
3. Nombre: "Rural24 Supabase Auth"
4. Permissions: "Full Access" (para testing) o "Mail Send" (producción)
5. Copiar API Key (solo se muestra una vez)
```

#### Paso 3: Configurar en Supabase

```bash
# Ir a Supabase Dashboard:
1. Project Settings → Authentication
2. SMTP Settings
3. Enable Custom SMTP

Configuración:
- Host: smtp.sendgrid.net
- Port: 587
- Username: apikey  (literal, no cambiar)
- Password: [TU_API_KEY_DE_SENDGRID]
- From Email: noreply@rural24.com.ar
- From Name: Rural24
```

#### Paso 4: Verificar Dominio (Opcional pero Recomendado)

**Sin dominio verificado:**
- ⚠️ Emails van a SPAM
- ⚠️ Menor tasa de entrega

**Con dominio verificado:**
- ✅ Emails en inbox
- ✅ 95%+ tasa de entrega

```bash
# En SendGrid:
1. Settings → Sender Authentication
2. Authenticate Your Domain
3. Agregar registros DNS:
   - CNAME para rural24.com.ar
   - DKIM records
   - SPF record

Ejemplo registros DNS:
- s1._domainkey.rural24.com.ar → CNAME → s1.domainkey.u123456.wl.sendgrid.net
- rural24.com.ar → TXT → v=spf1 include:sendgrid.net ~all
```

#### Paso 5: Testing

```bash
# En Supabase Dashboard:
1. Authentication → Email Templates
2. Click "Send Test Email"
3. Ingresar tu email
4. Verificar recepción

✅ Email llega → Setup correcto
❌ Email no llega → Revisar logs en SendGrid
```

### Setup AWS SES (Alternativa Económica)

**Requisitos:**
- Cuenta AWS
- Dominio verificado (obligatorio)
- Salir del "Sandbox Mode" (requiere request a AWS)

#### Paso 1: Configurar SES

```bash
# En AWS Console:
1. SES → Verified Identities
2. Create Identity → Domain
3. Agregar registros DNS (DKIM, SPF)
4. Esperar verificación (~15 min)
```

#### Paso 2: Crear SMTP Credentials

```bash
# En SES Dashboard:
1. SMTP Settings
2. Create SMTP Credentials
3. Guardar username y password
```

#### Paso 3: Request Production Access

```bash
# IMPORTANTE: SES empieza en "Sandbox Mode"
# Solo permite enviar a emails verificados

Hacer request:
1. SES → Account Dashboard
2. Request production access
3. Completar formulario:
   - Caso de uso: "User verification emails for marketplace"
   - Volumen esperado: "100-500 emails/día"
   - Bounce handling: "Yes, we handle bounces"
4. Esperar aprobación (1-3 días)
```

#### Paso 4: Configurar en Supabase

```bash
# Supabase Dashboard:
1. Authentication → SMTP Settings

Configuración:
- Host: email-smtp.us-east-1.amazonaws.com
- Port: 587
- Username: [SMTP_USERNAME_DE_SES]
- Password: [SMTP_PASSWORD_DE_SES]
- From Email: noreply@rural24.com.ar
- From Name: Rural24
```

---

## 📊 Comparación de Costos (Proyección)

### Escenario: 1000 usuarios nuevos/mes

| Solución | Costo Mensual | Límite | Notas |
|----------|---------------|--------|-------|
| **Supabase Free** | $0 | 30/hora = ~720/mes | ⚠️ Insuficiente |
| **Supabase Pro** | $25/mes | Ilimitado | Caro para solo emails |
| **SendGrid** | $15/mes | 40K emails | ✅ Recomendado |
| **AWS SES** | ~$0.10 | 1K emails | ✅ Más barato si >10K/mes |
| **Resend** | $20/mes | 50K emails | ✅ Mejor DX, moderno |

### Recomendación por Volumen

- **0-100 usuarios/mes**: Supabase Free + Login Social
- **100-1000 usuarios/mes**: SendGrid $15/mes
- **1000-10K usuarios/mes**: AWS SES $1-2/mes
- **10K+ usuarios/mes**: AWS SES + dedicated IP

---

## 🎯 Plan de Acción Recomendado

### Fase 1: Inmediato (Hoy)

- [x] ✅ Implementar detección de rate limit
- [x] ✅ Mejorar UX con opciones claras
- [x] ✅ Promover login social (Google/Facebook)
- [ ] ⏳ Deploy a producción

### Fase 2: Esta Semana

- [ ] 📧 Crear cuenta SendGrid
- [ ] 🔑 Generar API key
- [ ] ⚙️ Configurar SMTP en Supabase
- [ ] ✅ Testing de emails

### Fase 3: Próximos 15 días

- [ ] 🌐 Verificar dominio rural24.com.ar
- [ ] 📧 Configurar DNS (DKIM, SPF)
- [ ] 🎨 Personalizar templates de email
- [ ] 📊 Configurar tracking de deliverability

### Fase 4: Futuro (Opcional)

- [ ] 🔄 Migrar a AWS SES (si volumen >10K/mes)
- [ ] 📱 Implementar verificación por SMS (Twilio)
- [ ] 🤖 Sistema de onboarding automatizado
- [ ] 📈 Analytics de registro por canal

---

## 🔐 Mejores Prácticas

### 1. Prevenir Rate Limits

```typescript
// Frontend: Throttling de registro
const REGISTER_COOLDOWN = 2000; // 2 segundos entre intentos
let lastRegisterAttempt = 0;

async function registerWithThrottle() {
  const now = Date.now();
  const timeSince = now - lastRegisterAttempt;
  
  if (timeSince < REGISTER_COOLDOWN) {
    throw new Error(`Esperá ${Math.ceil((REGISTER_COOLDOWN - timeSince) / 1000)}s`);
  }
  
  lastRegisterAttempt = now;
  return await registerPersona(input);
}
```

### 2. Monitoreo

```typescript
// Backend: Log de rate limits
app.post('/api/register', async (req, res) => {
  try {
    const result = await registerUser(req.body);
    
    if (result.errorCode === 'RATE_LIMIT') {
      // Enviar alerta a Slack/Discord
      await notifyRateLimit({
        email: req.body.email,
        ip: req.ip,
        timestamp: new Date(),
      });
    }
    
    res.json(result);
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal error' });
  }
});
```

### 3. Fallback Strategy

```typescript
// Estrategia de múltiples intentos
async function registerWithFallback(input) {
  // 1. Intentar registro normal
  let result = await registerPersona(input);
  
  if (result.errorCode === 'RATE_LIMIT') {
    // 2. Ofrecer login social
    return {
      ...result,
      suggestSocial: true,
      socialProviders: ['google', 'facebook'],
    };
  }
  
  return result;
}
```

---

## 📚 Referencias

- [Supabase SMTP Docs](https://supabase.com/docs/guides/auth/auth-smtp)
- [SendGrid Integration](https://docs.sendgrid.com/for-developers/sending-email/integrations)
- [AWS SES Setup](https://docs.aws.amazon.com/ses/latest/dg/send-email-smtp.html)
- [Email Deliverability Best Practices](https://www.cloudflare.com/learning/email-security/email-deliverability/)

---

## ✅ Checklist de Validación

### Testing Local

- [x] Error de rate limit detectado correctamente
- [x] UI muestra mensaje apropiado
- [x] Login social funciona como alternativa
- [x] Formulario guarda datos en localStorage

### Testing Producción

- [ ] SMTP personalizado configurado
- [ ] Emails llegan a inbox (no spam)
- [ ] Tasa de entrega >90%
- [ ] Logs de bounces configurados

### Monitoreo

- [ ] Dashboard de Supabase revisado diariamente
- [ ] Alertas de rate limit configuradas
- [ ] Métricas de registro por canal
- [ ] Analytics de conversión (email vs social)

---

**Última actualización:** 12 Febrero 2026  
**Próxima revisión:** Post-configuración de SendGrid
