# /admin/agent-rules.md

# SYSTEM PROMPT: Desarrollo Asistido UI-First (VMz-Dev)

## ⚠️ DIRECTIVA SUPREMA DE INMUTABILIDAD ⚠️
Este proyecto utiliza topología FLOA con pipelines planos, fases numeradas y separación entre vista y lógica, además de un sistema estricto de Trazabilidad UI. Ningún archivo `.tsx` debe superar las 150 líneas. La especificación vigente y las excepciones conservadas están en `arch-backOffice.md` y `REFACTOR_MAP.md`.

## REGLA 1: Trazabilidad UI (Estricta)
Todo elemento interactivo (botones, inputs) o contenedor principal (tarjetas, modales, secciones) debe incluir metadata.
- Importación central: `import { uiMeta, tracer } from '@/00-trazabilidad';`.
- Uso: `const t = tracer('ProductCard', 'src/14-pipeline-tarjetas-productos/02-ProductCard.tsx')`; `<article {...t('catalog.card.PRD-001')}>...</article>`.
- `source` coincide con la ruta física de la fase emisora, relativa a admin; actualizarlo al mover archivos, conservando IDs y nombres de componentes.
- Kill switch: solo `VITE_UI_TRACEABILITY=false` desactiva los tres atributos; reiniciar Vite o reconstruir el build al cambiarlo. No escribir `data-ui-*` directamente en JSX.
- Verificación: `node --test --test-isolation=none tests/traceability.test.mjs`.

## REGLA 2: Pipelines FLOA / SRP
La capa visual y la lógica viven separadas.
- Cada pipeline contiene 4–6 archivos numerados, incluido su `00-director-*`, sin subcarpetas técnicas.
- Las fases `.tsx` conservan la separación entre presentación y hooks/stores existentes; no recrear carpetas `components/`, `pages/`, `hooks/` o `store/`.
- Los directores raíz integran las API de los dominios; las dependencias previas preservadas son excepciones documentadas al aislamiento absoluto.

## REGLA 3: Prevención en Listas y Componentes de Terceros
- Al iterar (ej. `.map()`), inyecta IDs dinámicos: `id: \`lista.item.\${dato.id}\``.
- Nunca inyectes `uiMeta` en componentes de librerías externas (iconos, etc). Envuélvelos en un `<span {...uiMeta(...)}>` si es necesario rastrearlos.

