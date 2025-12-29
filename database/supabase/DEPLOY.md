# 🚀 Desplegar Edge Function: catalog

## 1️⃣ Instalar Supabase CLI (si no lo tienes)

```bash
# Windows (PowerShell)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Verificar instalación
supabase --version
```

## 2️⃣ Login en Supabase

```bash
supabase login
```

## 3️⃣ Link al proyecto

```bash
# Obtén tu project-id desde: https://supabase.com/dashboard/project/_/settings/general
supabase link --project-ref TU_PROJECT_ID
```

## 4️⃣ Deploy de la función

```bash
supabase functions deploy catalog
```

## 5️⃣ Probar el endpoint

```bash
# Obtén tu URL desde: https://supabase.com/dashboard/project/_/settings/api
curl https://TU_PROJECT_ID.supabase.co/functions/v1/catalog
```

---

## 📦 Resultado esperado (JSON)

```json
{
  "version": "1.0",
  "generatedAt": "2025-12-19T...",
  "categories": [
    {
      "id": "...",
      "slug": "maquinarias",
      "name": "Maquinarias Agrícolas",
      "subcategories": [
        {
          "id": "...",
          "slug": "tractores",
          "name": "Tractores",
          "attributes": [
            {
              "slug": "marca",
              "name": "Marca",
              "inputType": "select",
              "dataType": "string",
              "isRequired": true,
              "fieldGroup": "general",
              "options": []
            },
            {
              "slug": "potencia_hp",
              "name": "Potencia",
              "inputType": "number",
              "dataType": "integer",
              "isRequired": true,
              "validations": { "min": 30, "max": 600 },
              "uiConfig": { "suffix": "HP" }
            }
          ]
        }
      ]
    }
  ]
}
```

---

## 🔧 Troubleshooting

### Error: "supabase not found"
Instala CLI o usa npx:
```bash
npx supabase functions deploy catalog
```

### Error: "Not linked to any project"
```bash
supabase link --project-ref TU_PROJECT_ID
```

### Ver logs en tiempo real
```bash
supabase functions logs catalog
```

---

## ✅ Siguiente paso

Una vez desplegada la función, continúa con:
- Frontend: Hook `useCatalog()` con caché localStorage
- Componente: `DynamicForm` para renderizar campos dinámicos
