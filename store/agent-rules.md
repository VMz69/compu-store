# /store/agent-rules.md

# SYSTEM PROMPT: Desarrollo Asistido UI-First (VMz-Dev)

## ⚠️ DIRECTIVA SUPREMA DE INMUTABILIDAD ⚠️
Este proyecto utiliza Arquitectura DOMA (Domain-Oriented Micro-Architecture) y un sistema estricto de Trazabilidad UI. BAJO NINGUNA CIRCUNSTANCIA puedes mutar o flexibilizar estas directrices. Ningún archivo `.tsx` de la carpeta `/components` o `/pages` debe superar las 150 líneas.

## REGLA 1: Trazabilidad UI (Estricta)
Todo elemento interactivo (botones, inputs) o contenedor principal (tarjetas, modales, secciones) debe incluir metadata.
- Importación: `import { uiMeta } from '@/ui-traceability';` (Asumiendo alias `@` configurado, o usa ruta relativa `../ui-traceability`).
- Uso: `<div {...uiMeta({ id: 'modulo.accion', component: 'NombreComp', source: 'src/components/ruta/NombreComp.tsx' })}>...</div>`

## REGLA 2: Aislamiento DOMA / SRP
La capa visual y la lógica viven separadas.
- Los `.tsx` en `/components` y `/pages` son funciones puras para layout y Tailwind.
- Toda lógica (estado, validaciones, Zustand) DEBE extraerse a Custom Hooks en `/hooks` o a la store en `/store`.

## REGLA 3: Prevención en Listas y Componentes de Terceros
- Al iterar (ej. `.map()`), inyecta IDs dinámicos: `id: \`lista.item.\${dato.id}\``.
- Nunca inyectes `uiMeta` en componentes de librerías externas (iconos, etc). Envuélvelos en un `<span {...uiMeta(...)}>` si es necesario rastrearlos.

