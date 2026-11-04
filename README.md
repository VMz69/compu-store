# CompuStore SV

Proyecto de comercio electrónico para CompuStore SV, tienda de computadoras y accesorios ubicada en Cojutepeque, El Salvador. El repositorio reúne la vitrina pública, un prototipo de administración de inventario y una carpeta preparada para una futura API.

## Aplicaciones

| Carpeta | Propósito | Estado actual |
| --- | --- | --- |
| [`store/`](store/) | Tienda pública: catálogo, búsqueda, productos, carrito, favoritos, ofertas y contacto. | Frontend funcional con datos locales; el pedido se coordina por WhatsApp. |
| [`admin/`](admin/) | Panel de administración con una tabla de inventario. | Prototipo visual con datos de ejemplo; no está conectado a la tienda ni a un backend. |
| [`api/`](api/) | Espacio para el futuro servidor. | Aún no contiene implementación ni comandos de desarrollo o ejecución. |

No hay un workspace ni scripts en la raíz: cada frontend tiene su propio `package.json`, archivo de bloqueo y ciclo de instalación. La carpeta `api` tampoco es necesaria para ejecutar las aplicaciones actuales.

## Tecnologías

- **Tienda:** React 19, TypeScript, Vite 8, React Router 7, Zustand 5 y Tailwind CSS 4.
- **Administración:** React 19, TypeScript, Vite 8 y Material UI, incluido Data Grid.
- **API:** sin stack de servidor implementado todavía.

Se requiere Node.js compatible con Vite 8 y pnpm. La configuración de `api/package.json` declara pnpm `12.16.1` como versión del gestor.

## Inicio rápido

Ejecuta cada aplicación desde su propia carpeta. En dos terminales, por ejemplo:

```bash
cd store
pnpm install
pnpm dev
```

```bash
cd admin
pnpm install
pnpm dev
```

Vite muestra en la terminal la URL local de cada aplicación. Si ambas se inician simultáneamente, Vite puede asignar un puerto alternativo a la segunda.

## Comandos disponibles

Tanto `store` como `admin` ofrecen los siguientes scripts, que se ejecutan dentro de la carpeta correspondiente:

```bash
pnpm dev       # iniciar Vite en modo desarrollo
pnpm build     # comprobar TypeScript y generar dist/
pnpm lint      # ejecutar ESLint
pnpm preview   # servir localmente el build de dist/
```

## Funcionalidad de la tienda

- Navegación por inicio, categorías, marcas, ofertas, búsqueda y detalle de producto.
- Carrito y favoritos con estado persistido en el navegador.
- Tema claro/oscuro, con preferencia inicial del sistema.
- Información de la tienda y formulario de contacto.
- Preparación de pedidos y consultas mediante enlaces de WhatsApp; no se procesa el pago en el sitio.

El catálogo, las marcas, las categorías y la configuración del negocio son datos estáticos en `store/src/data/`. El inventario del panel también es estático y está en `admin/src/data/dummyInventory.ts`.

## Estructura principal

```text
store/src/
  components/   Componentes de interfaz por dominio
  pages/        Vistas y rutas de la tienda
  hooks/        Lógica de vistas
  services/     Operaciones de catálogo, carrito y WhatsApp
  store/        Estado global con Zustand
  data/         Catálogo y configuración estáticos
  types/        Tipos compartidos
  ui-traceability/ Metadatos de trazabilidad de interfaz

admin/src/
  App.tsx       Panel y tabla de inventario
  data/         Inventario de ejemplo

api/
  package.json  Configuración inicial, sin servidor implementado
```

La arquitectura y las convenciones del frontend público están documentadas en [`store/README.md`](store/README.md), [`store/arch-fronOffice.md`](store/arch-fronOffice.md) y [`store/agent-rules.md`](store/agent-rules.md). El diagnóstico técnico y las limitaciones conocidas están en [`store/DIAGNOSTICO.md`](store/DIAGNOSTICO.md).

## Estado y alcance

El panel no modifica actualmente el catálogo que muestra la tienda: ambas aplicaciones usan sus propios datos de ejemplo. La carpeta `api` solo incluye metadatos de paquete y configuración TypeScript; no ofrece endpoints ni un script de prueba útil. Para convertir el prototipo en un sistema integrado, falta implementar el backend y conectar tanto la tienda como el panel a una fuente de datos común.