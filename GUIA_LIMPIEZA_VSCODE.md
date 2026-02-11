# Guía: Solucionar Múltiples Procesos de VS Code

## Problema Actual
**19 procesos de VS Code** corriendo simultáneamente, causando:
- Alto consumo de memoria
- Ralentización del sistema
- Cierres inesperados de VS Code

## ¿Por qué sucede esto?

### Causas Comunes:
1. **Extensiones problemáticas**: Cada extensión puede crear 1-3 procesos adicionales
2. **Terminales no cerrados**: Cada terminal integrado activo = 1 proceso
3. **Language Servers**: TypeScript, ESLint, Prisma, etc. = 1 proceso c/u
4. **Procesos huérfanos**: Extensiones que no se cierran correctamente al salir de VS Code

## Solución Inmediata

### 1. Limpieza Rápida (Ya ejecutada)
```powershell
.\cleanup-processes.ps1
```

### 2. Reiniciar VS Code Limpio
```powershell
# Cerrar TODO VS Code
Get-Process -Name Code | Stop-Process -Force

# Esperar 5 segundos
Start-Sleep -Seconds 5

# Abrir VS Code fresco
code c:\Users\German\rural24
```

## Soluciones a Largo Plazo

### A. Revisar y Desactivar Extensiones Innecesarias

1. Abre la paleta de comandos: `Ctrl+Shift+P`
2. Escribe: `Extensions: Show Running Extensions`
3. Identifica las que consumen más recursos
4. Desactiva las que no uses frecuentemente

**Extensiones comunes problemáticas:**
- Docker (si no usas Docker)
- Kubernetes/Cloud Code
- Remote Development (si no usas WSL/SSH)
- Extensiones de lenguajes que no usas

### B. Optimizar Configuración de VS Code

Crea/edita `.vscode/settings.json`:

```json
{
  "extensions.autoUpdate": false,
  "extensions.autoCheckUpdates": false,
  "terminal.integrated.persistentSessionReviveProcess": "never",
  "files.watcherExclude": {
    "**/node_modules/**": true,
    "**/.git/**": true,
    "**/.next/**": true,
    "**/dist/**": true,
    "**/build/**": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/bower_components": true,
    "**/.next": true,
    "**/dist": true,
    "**/build": true
  },
  "typescript.tsserver.maxTsServerMemory": 4096,
  "typescript.disableAutomaticTypeAcquisition": false
}
```

### C. Usar Scripts de Inicio/Parada Correctamente

**SIEMPRE** usa los scripts para iniciar servicios:

```powershell
# Iniciar desarrollo
.\start-dev.ps1

# Detener TODO antes de cerrar VS Code
.\cleanup-processes.ps1
```

**NUNCA:**
- Cierres VS Code sin detener servicios primero
- Inicies múltiples instancias de frontend/backend manualmente

### D. Cerrar Terminales No Usados

En VS Code:
1. Click derecho en terminal → `Kill Terminal`
2. O usa `Ctrl+Shift+P` → `Terminal: Kill All Terminals`

### E. Configurar Auto-Limpieza al Cerrar

Edita tu PowerShell profile:

```powershell
# Ver ubicación del profile
$PROFILE

# Editarlo
code $PROFILE
```

Agrega al final:

```powershell
# Limpieza automática al cerrar PowerShell
$PSCDefaultParameterValues['Out-Default:OutVariable'] = '__'
```

## Monitoreo

### Script de Estado (ya existe)
```powershell
.\status.ps1
```

### Ver Procesos Rápidamente
```powershell
# Contar procesos actuales
Write-Host "Code: $((Get-Process -Name Code -ErrorAction SilentlyContinue).Count)"
Write-Host "Node: $((Get-Process -Name node -ErrorAction SilentlyContinue).Count)"
Write-Host "PowerShell: $((Get-Process -Name powershell -ErrorAction SilentlyContinue).Count)"
```

## Rutina Recomendada

### Al Iniciar el Día:
1. Ejecutar `cleanup-processes.ps1` antes de abrir VS Code
2. Abrir VS Code limpio
3. Iniciar servicios con `start-dev.ps1`

### Durante el Trabajo:
- Cerrar terminales que no uses
- No dejar procesos corriendo en background innecesariamente

### Al Terminar el Día:
1. Ejecutar `cleanup-processes.ps1`
2. Cerrar VS Code completamente
3. Verificar en Administrador de Tareas que todo esté cerrado

## Señales de Alerta

Si ves más de:
- **10 procesos Code** → Reiniciar VS Code
- **5 procesos Node** → Revisar qué está corriendo (`.\status.ps1`)
- **10 procesos PowerShell** → Ejecutar `cleanup-processes.ps1`

## Comandos Útiles

```powershell
# Ver memoria usada por VS Code
Get-Process -Name Code | Measure-Object -Property WorkingSet64 -Sum | 
  Select-Object @{N='TotalMB';E={[math]::Round($_.Sum/1MB, 2)}}

# Ver extensiones activas (dentro de VS Code terminal)
code --list-extensions --show-versions

# Desabilitar todas las extensiones temporalmente
code --disable-extensions

# Limpiar cache de VS Code
Remove-Item -Recurse -Force "$env:APPDATA\Code\Cache"
Remove-Item -Recurse -Force "$env:APPDATA\Code\CachedData"
```

## Contacto de Soporte

Si el problema persiste después de seguir estos pasos:
1. Ejecuta: `Get-Process | Export-Csv processes-debug.csv`
2. Revisa qué extensiones están instaladas
3. Considera reinstalar VS Code limpiamente

---

**Última actualización:** 11 Febrero 2026
**Creado por:** GitHub Copilot
