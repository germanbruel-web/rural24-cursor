# .claude/ — Sistema de documentación Claude Code
> Creado: 2026-03-07 19:19
> Reemplaza: `.cursor/CLAUDE/` + `.cursor/rules/` (archivados en `OlderCursor/`)

## Estructura

```
.claude/
├── README.md          ← este archivo
├── docs/              ← guías operativas y análisis
│   ├── DB_SCRIPTS.md
│   ├── DEPLOY_CIRCUIT.md
│   ├── GUIA_RAPIDA.md
│   └── analisis-pwa-marzoV1.md
├── sprints/           ← un .md por sprint, con fecha y hora
│   └── SPRINT_4A_OPTION_LISTS.md
└── agents/            ← definiciones de agentes (futuro)
```

## Convención para sprints

Cada sprint genera un archivo en `.claude/sprints/`:
- Nombre: `SPRINT_<ID>_<SLUG>.md`
- Contenido obligatorio: fecha/hora, estado, archivos afectados, incidentes, próximos pasos

## Punto de entrada

Claude Code carga `CLAUDE.md` (raíz del repo) automáticamente.
La memoria dinámica vive en `~/.claude/projects/.../memory/MEMORY.md`.
