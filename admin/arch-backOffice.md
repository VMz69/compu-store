# Blueprint · Back Office `/admin` — CompuStore SV

> **Objetivo:** prototipo funcional con datos dummy (inventario, pedidos, facturación, CRM, ofertas, moderación) con trazabilidad desactivable.
> **Stack:** React 19 · Vite 8 · TS 7 (`tsc`) + TS 6 (tooling) · Tailwind v4 · React Router 7 · Zustand 5 · jsPDF
> **Fuente visual:** `mocksUI-base/compustore_sv_back_office.html` · **Gemelo:** [`store/arch-fronOffice.md`](../store/arch-fronOffice.md)
> **Última auditoría:** 2026-11-12 — arquitectura FLOA; 139 emisores con rutas actuales; 7 comprobaciones automatizadas de trazabilidad en verde; 46 escenarios en Chrome sobre builds de producción con el kill switch activado/desactivado; typecheck, lint y build sin errores. Las reglas de negocio y datos mock se conservan.

---

## 0. Convenciones del Back Office y contratos compartidos

`/admin` usa la topología FLOA descrita aquí. El Front Office conserva su propia estructura; ambos mantienen el contrato de metadatos UI. Las excepciones al aislamiento y el mapa completo de la migración están en [REFACTOR_MAP.md](./REFACTOR_MAP.md).

| Aspecto | Convención de admin |
|---|---|
| Arquitectura | 88 pipelines paralelos en `src/`, sin subcarpetas internas, con 4–6 archivos numerados por pipeline |
| Entrada del pipeline | `00-director-[nombre].ts`: reexportación de una fase ya consumida, sin lógica nueva |
| Integración de dominios | Directores raíz como `src/00-director-catalogo.ts` y `src/00-director-ventas.ts`; conservan las API y registros anteriores |
| Anatomía | Fases `01-`, `02-`, etc., en archivos `.ts`/`.tsx`; no existen carpetas técnicas `app/`, `features/`, `shared/`, `components/`, `hooks/` o `lib/` dentro de src/ |
| Vista | `.tsx` ≤ 150 líneas (ESLint `max-lines`); estado y cálculos en hooks/funciones existentes |
| Lógica | Hooks, funciones puras y stores Zustand conservan sus símbolos y responsabilidades en archivos numerados |
| Datos | Doce módulos mock repartidos entre los pipelines `86-`, `87-` y `88-`; valores y esquemas persistidos intactos |
| Trazabilidad | `src/00-trazabilidad.ts`: `uiMeta` + `tracer`; atributos `data-ui-id`, `data-ui-component`, `data-ui-source`; kill switch `VITE_UI_TRACEABILITY` |
| Alias | `@/*` → `src/*` |

La adopción es conservadora: se preservaron las dependencias existentes entre fases/pipelines y las inicializaciones de puertos. No hay un bus global nuevo ni aislamiento absoluto; esas excepciones están documentadas y no autorizan añadir nuevos acoplamientos.

---

## 1. Reglas

1. **Máximo 150 líneas por `.tsx`** (ESLint lo bloquea); páginas < 60.
2. **La vista no lleva lógica.** Estado, cálculos y validaciones en hooks, funciones puras o stores de las fases numeradas (incluidas suscripciones: p. ej. `useStatusMeta`).
3. **Mocking-first.** Las acciones simulan latencia (`delay()`) y exponen `isLoading`; los envíos con varios pasos usan un candado local (`saving`) contra dobles clics.
4. **Permisos** se validan en los hooks de acciones (`ensurePermission`); la vista solo oculta o deshabilita botones. Mensajes de rechazo en términos de **permiso**, no de rol (§4).
5. **Integración conservadora:** los directores raíz conservan las API de los dominios y sus registros de puertos (§7). La migración preservó el grafo previo, incluidos sus ciclos; no se afirma aislamiento absoluto. Para nuevos flujos, evitar imports directos entre pipelines y coordinar su composición desde la raíz; las excepciones existentes se detallan en REFACTOR_MAP.md.
6. **Clases Tailwind completas**, nunca concatenadas (`bg-${x}-50` no se genera en v4). Importante en v4: sufijo `!` (`hover:text-red-500!`).
7. **Reglas de negocio = funciones puras** que devuelven `null` o el motivo del bloqueo (`editBlockedReason`, `deleteBlockedReason`, `categoryDeleteBlock`…). La vista las usa para deshabilitar con tooltip y el hook/store las revalida.
8. **Documentos con snapshot:** pedidos, cotizaciones y facturas copian precios, cliente y emisor al emitirse; editar catálogo, clientes o ajustes no altera lo emitido.
9. **Nada se borra si tiene historial:** se bloquea con motivo y se ofrece la alternativa (desactivar, reasignar, anular primero) o se usa **eliminación lógica** (pedidos).
10. **Cambios de esquema persistido** suben `version` del store y traen `migrate` (§10).
11. **Ventanas emergentes en portal** (`useAnchoredPopover`): calendarios y menús anclados se dibujan en `document.body` con posición fija, para que no los recorten paneles con scroll ni modales; Escape cierra solo la ventana emergente.
12. **Fechas de negocio = fechas locales `YYYY-MM-DD`** (`src/71-pipeline-seleccion-fechas/05-date.ts`: `todayISO`, `addDaysISO`, `formatLongISO`…). Nunca `toISOString()` para un día local (en El Salvador, UTC−6, desplaza la fecha).
13. **Sin selectores nativos de fecha:** se usa `DatePicker`/`Calendar` (tema claro/oscuro, teclado completo, límites).
14. **Barra de listados (`ListToolbar`, disposición única):** franja de ancho completo bajo la Topbar; arriba, línea de ubicación opcional (*Vista › Área*); debajo, **izquierda: [Áreas (`SegmentedTabs`)] [Filtros]** ··· **derecha: [Auxiliar] [Buscador (`LiveSearch`)] [Acción principal]**. El buscador va siempre a la derecha: es el último elemento de la fila, salvo que exista una acción principal, que entonces cierra la fila. Ancho del buscador: `sm:w-80 xl:w-96`. En pantallas angostas el grupo derecho baja a su propia fila y el buscador ocupa el ancho disponible. Aplicado en Productos, Pedidos, Facturación, Clientes, Categorías y marcas, Ofertas, Cotizaciones, Comentarios y Usuarios. Todas las búsquedas usan `matchesQuery`.
15. **Título único de la vista (h1) solo en la barra superior.** Las páginas no repiten su título ni usan encabezados propios. Vistas principales: nombre del menú (`VIEW_CATALOG`). Las pestañas/áreas **no** cambian el título de la Topbar: la ubicación del área (*Ofertas › Vigentes*) se muestra en la línea `context` de la `ListToolbar`, con la etiqueta expuesta por el hook dueño del área (`areaLabel`/`activeLabel`). Sub-vistas: `usePageMeta({ title, crumbs, backTo, badge })`; la Topbar muestra ruta, botón volver y etiqueta, y actualiza `document.title`. **Excepción, Ajustes:** `useSettingsPageMeta(title)` deja solo el título en la Topbar; el regreso va **dentro del contenido**, discreto, en la esquina superior izquierda (`BackLink`: “‹ Ajustes”, “‹ Usuarios” en Accesos; en vistas con `ListToolbar`, en su fila superior vía `back`). El atajo de Ajustes de la Topbar también queda resaltado y vuelve al hub.

---

## 2. Configuración

| Elemento | Valor |
|---|---|
| `vite.config.ts` | alias `@`, `port: 5174`, `base` desde `VITE_BASE_PATH`, copia `404.html` (SPA fallback) |
| `.env` | `VITE_UI_TRACEABILITY`, `VITE_STORE_URL`, `VITE_BASE_PATH`, `VITE_SHOW_DEMO_CREDENTIALS` |
| TypeScript | `typescript` = alias de `@typescript/typescript6` (lo exige typescript-eslint); `@typescript/native` = TS 7 (`tsc -b`) |
| Scripts | `pnpm dev` · `pnpm lint` (`eslint .`) · `pnpm build` (`tsc -b && vite build`) |
| Despliegue | `public/_redirects`, `_headers`, `.htaccess`, `vercel.json` |

---

## 3. Capa de trazabilidad y kill switch

```tsx
import { tracer } from '@/00-trazabilidad'

const t = tracer('ProductCard', 'src/14-pipeline-tarjetas-productos/02-ProductCard.tsx')
<article {...t(`catalog.card.${p.id}`)}>…</article>
```

- **Contrato estable:** `uiMeta({ id, component, source })` devuelve los tres atributos `data-ui-id`, `data-ui-component`, `data-ui-source` cuando la trazabilidad está activa. `tracer(component, source)` fija componente y ruta y delega en `uiMeta` para cada ID.
- **Identidad:** los IDs de negocio y los nombres de componentes se conservan. Los prefijos de pipeline no se incorporan a los IDs. Ejemplo: `sales.table.status.ORD-2026-001` sigue siendo el mismo ID.
- **Ruta física:** `source` es la ruta real relativa a admin, empezando por `src/`, con el nombre numerado de la fase que emite la metadata. No apunta al director que la reexporta. Los 139 emisores se actualizaron al árbol FLOA.
- **Propagación:** los controles compartidos reciben la metadata por props; por ello un Input/Button puede señalar al archivo de su consumidor. Los componentes con instrumentación propia (por ejemplo, SegmentedTabs) emiten la ruta de su propia fase. Modales, botones de cierre y portales usan el mismo helper y respetan el mismo apagado.
- **Punto único:** todos los emisores importan `@/00-trazabilidad`. No se escriben atributos `data-ui-*` directamente en JSX, para que el kill switch pueda retirarlos de forma uniforme.

| Valor de `VITE_UI_TRACEABILITY` | Resultado |
|---|---|
| Ausente, `true`, cadena vacía u otro valor, incluido `FALSE` | Trazabilidad activa |
| Cadena exacta `false` | `uiMeta` y las funciones de `tracer` devuelven `{}`; no se emiten los tres atributos |

La variable se evalúa al cargar el módulo y Vite la incorpora al transformar/compilar. Para cambiarla, reiniciar el servidor de desarrollo o reconstruir y desplegar el build. No es un control dinámico en localStorage ni un ajuste dependiente de PROD: QA/staging/producción pueden conservar la instrumentación.

```bash
# Desde admin/: apagar para esta ejecución o este build.
VITE_UI_TRACEABILITY=false pnpm dev
VITE_UI_TRACEABILITY=false pnpm build

# Activar explícitamente, incluso en producción.
VITE_UI_TRACEABILITY=true pnpm build

# Auditoría repetible sin dependencias adicionales.
node --test --test-isolation=none tests/traceability.test.mjs
```

Las pruebas comprueban rutas físicas y uso del helper central, los cinco valores de la tabla, IDs dinámicos independientes y propagación a HTML real de Button, Input, Modal/ModalHeader y SegmentedTabs. Tras retirar solo los atributos de trazabilidad, el HTML restante coincide entre los cinco casos.

---

## 4. Acceso: RBAC por vistas

| Concepto | Definición |
|---|---|
| **Catálogo de vistas** | `src/09-pipeline-accesos-por-vista/02-views.config.ts` (`VIEW_CATALOG`): id, etiqueta, ícono y **acciones** (permisos) de cada vista. Única fuente para el sidebar (`src/03-pipeline-navegacion-administrativa/05-nav.config.ts`) y para la pantalla de Accesos. |
| **Accesos del usuario** | `User.access = { views, permissions }`. Una acción solo vale si su vista está habilitada (`normalizeAccess`). La vista de inicio es la primera habilitada en el orden del menú. |
| **Rol** | Solo **plantilla** inicial + etiqueta del puesto (`src/86-pipeline-datos-demo-personas/01-roles.mock.ts`). Al crear un usuario o cambiarle el rol, sus accesos se copian de la plantilla (`templateAccess`). |
| **Rol efectivo** | `effectiveRole(user)` = datos del rol + vistas/permisos del usuario. Todo el sistema sigue leyendo `role.allowedViews` y `role[permiso]` (`useSession`, `getCurrentRole`, `ensurePermission`). |
| **Super Administrador** | = **Administrador de Sistema** (`sistemas@`). Acceso total siempre; sus accesos no se editan. Debe existir al menos uno activo (`src/08-pipeline-edicion-usuarios/03-userRules.ts`). El dueño (`propietario@`) usa la plantilla Gerencia. |
| **Salvaguardas** | Nadie edita sus propios accesos; mínimo una vista; editar requiere `canManageUsers` (si no, la pantalla queda en solo lectura). |

Permisos por vista: Productos (`canCreateProduct`, `canEditProduct`, `canDeleteProduct`, `canUpdateStock`, `canToggleVisibility`) · Pedidos (`canChangeOrderStatus`, **`canReserveOrders`** = Confirmar y reservar, `canDeleteOrders`) · Facturación (`canInvoice`) · Clientes (`canManageCustomers`, `canDeleteCustomers`) · Categorías y marcas (`canManageTaxonomy`) · Ofertas (`canManageOffers`) · Cotizaciones (`canManageQuotes`) · Comentarios (`canModerateReviews`) · Ajustes (`canManageUsers`, `canEditSettings`). Tablero: solo consulta.

---

## 5. Topología FLOA

La estructura estándar de Vite fuera de `src/` se conserva. Este árbol enumera los 492 archivos actuales de `admin/src/`: los 404 originales y 88 directores nuevos de reexportación, distribuidos en 88 pipelines planos, la raíz de integración y la documentación histórica. Se incluyen todas las carpetas y archivos, con sus nombres físicos actuales. El mapeo de rutas anteriores está en [REFACTOR_MAP.md](./REFACTOR_MAP.md).

```txt
src/
├── 00-director-acceso.ts
├── 00-director-ajustes.ts
├── 00-director-catalogo.ts
├── 00-director-clientes.ts
├── 00-director-cotizaciones.ts
├── 00-director-estado.ts
├── 00-director-facturacion.ts
├── 00-director-interaccion.ts
├── 00-director-interacciones.ts
├── 00-director-interfaz.ts
├── 00-director-ofertas.ts
├── 00-director-tablero.ts
├── 00-director-utilidades.ts
├── 00-director-ventas.ts
├── 00-documentacion/
│   ├── 01-catalog-components-00Tree.html
│   ├── 02-catalog-components-detail-00Tree.html
│   ├── 03-catalog-components-form-00Tree.html
│   ├── 04-catalog-components-form-tabs-00Tree.html
│   ├── 05-catalog-components-form-tabs-images-00Tree.html
│   ├── 06-catalog-components-grid-00Tree.html
│   ├── 07-catalog-components-picker-00Tree.html
│   ├── 08-catalog-components-table-00Tree.html
│   ├── 09-catalog-components-taxonomy-00Tree.html
│   ├── 10-catalog-components-toolbar-00Tree.html
│   ├── 11-catalog-hooks-00Tree.html
│   ├── 12-catalog-hooks-form-00Tree.html
│   ├── 13-catalog-lib-00Tree.html
│   ├── 14-catalog-mocks-00Tree.html
│   ├── 15-catalog-pages-00Tree.html
│   └── 16-settings-ESCALABILIDAD.md
├── 00-entorno.d.ts
├── 00-estilos-globales.css
├── 00-orquestador-principal.tsx
├── 00-trazabilidad.ts
├── 01-pipeline-rutas-protegidas/
│   ├── 00-director-rutas-protegidas.ts
│   ├── 01-router.tsx
│   ├── 02-RequireAuth.tsx
│   ├── 03-RequireView.tsx
│   ├── 04-HomeRedirect.tsx
│   └── 05-NotFoundPage.tsx
├── 02-pipeline-marco-administrativo/
│   ├── 00-director-marco-administrativo.ts
│   ├── 01-AdminLayout.tsx
│   ├── 02-useLayout.ts
│   ├── 03-RootLayout.tsx
│   ├── 04-Overlays.tsx
│   └── 05-ModalHost.tsx
├── 03-pipeline-navegacion-administrativa/
│   ├── 00-director-navegacion-administrativa.ts
│   ├── 01-Sidebar.tsx
│   ├── 02-SidebarNavItem.tsx
│   ├── 03-SidebarProfile.tsx
│   ├── 04-useNavItems.ts
│   └── 05-nav.config.ts
├── 04-pipeline-cabecera-administrativa/
│   ├── 00-director-cabecera-administrativa.ts
│   ├── 01-Topbar.tsx
│   ├── 02-TopbarTitle.tsx
│   ├── 03-TopbarShortcut.tsx
│   └── 04-ThemeToggle.tsx
├── 05-pipeline-inicio-sesion/
│   ├── 00-director-inicio-sesion.ts
│   ├── 01-LoginPage.tsx
│   ├── 02-useLoginForm.ts
│   ├── 03-LoginCard.tsx
│   └── 04-DemoCredentials.tsx
├── 06-pipeline-sesion-permisos/
│   ├── 00-director-sesion-permisos.ts
│   ├── 01-useSession.ts
│   ├── 02-permissions.ts
│   ├── 03-access.ts
│   ├── 04-store.ts
│   └── 05-types.ts
├── 07-pipeline-administracion-usuarios/
│   ├── 00-director-administracion-usuarios.ts
│   ├── 01-UsersSection.tsx
│   ├── 02-useUsersAdmin.ts
│   ├── 03-useAccessActions.ts
│   ├── 04-UserRow.tsx
│   └── 05-RoleBadge.tsx
├── 08-pipeline-edicion-usuarios/
│   ├── 00-director-edicion-usuarios.ts
│   ├── 01-UserFormModal.tsx
│   ├── 02-useUserForm.ts
│   ├── 03-userRules.ts
│   ├── 04-UserAvatar.tsx
│   └── 05-modals.ts
├── 09-pipeline-accesos-por-vista/
│   ├── 00-director-accesos-por-vista.ts
│   ├── 01-useUserAccess.ts
│   ├── 02-views.config.ts
│   ├── 03-AccessSidebar.tsx
│   ├── 04-AccessSummaryBar.tsx
│   └── 05-ViewActionsPanel.tsx
├── 10-pipeline-cambio-contrasena/
│   ├── 00-director-cambio-contrasena.ts
│   ├── 01-ChangePasswordScreen.tsx
│   ├── 02-usePasswordForms.ts
│   ├── 03-NewPasswordFields.tsx
│   └── 04-password.ts
├── 11-pipeline-restablecimiento-contrasena/
│   ├── 00-director-restablecimiento-contrasena.ts
│   ├── 01-ResetPasswordModal.tsx
│   ├── 02-PasswordInput.tsx
│   └── 03-PasswordStrength.tsx
├── 12-pipeline-listado-productos/
│   ├── 00-director-listado-productos.ts
│   ├── 01-ProductsPage.tsx
│   ├── 02-useFilteredProducts.ts
│   ├── 03-usePaginatedProducts.ts
│   └── 04-ProductsEmptyState.tsx
├── 13-pipeline-filtros-productos/
│   ├── 00-director-filtros-productos.ts
│   ├── 01-useProductFilters.ts
│   ├── 02-filters.store.ts
│   ├── 03-ProductToolbar.tsx
│   └── 04-ViewModeToggle.tsx
├── 14-pipeline-tarjetas-productos/
│   ├── 00-director-tarjetas-productos.ts
│   ├── 01-ProductGrid.tsx
│   ├── 02-ProductCard.tsx
│   ├── 03-CardMedia.tsx
│   ├── 04-CardBody.tsx
│   └── 05-CardFooter.tsx
├── 15-pipeline-tabla-existencias/
│   ├── 00-director-tabla-existencias.ts
│   ├── 01-ProductTable.tsx
│   ├── 02-ProductTableRow.tsx
│   ├── 03-StockBadge.tsx
│   ├── 04-StockStepper.tsx
│   └── 05-ReservedBadge.tsx
├── 16-pipeline-consulta-producto/
│   ├── 00-director-consulta-producto.ts
│   ├── 01-ProductDetailModal.tsx
│   ├── 02-useProductDetail.ts
│   ├── 03-DetailSummary.tsx
│   └── 04-DetailMetrics.tsx
├── 17-pipeline-ficha-producto/
│   ├── 00-director-ficha-producto.ts
│   ├── 01-DetailGallery.tsx
│   ├── 02-DetailSpecs.tsx
│   └── 03-productImages.ts
├── 18-pipeline-edicion-producto/
│   ├── 00-director-edicion-producto.ts
│   ├── 01-ProductFormModal.tsx
│   ├── 02-useProductForm.ts
│   ├── 03-useProductFormState.ts
│   ├── 04-ProductFormTabs.tsx
│   └── 05-ProductFormFooter.tsx
├── 19-pipeline-datos-comerciales-producto/
│   ├── 00-director-datos-comerciales-producto.ts
│   ├── 01-GeneralTab.tsx
│   ├── 02-PricingTab.tsx
│   ├── 03-CommercialSummary.tsx
│   ├── 04-LogisticsTab.tsx
│   └── 05-LotRowsEditor.tsx
├── 20-pipeline-validacion-producto/
│   ├── 00-director-validacion-producto.ts
│   ├── 01-productForm.ts
│   ├── 02-productValidation.ts
│   ├── 03-normalize.ts
│   ├── 04-SpecsTab.tsx
│   └── 05-SpecRowsEditor.tsx
├── 21-pipeline-imagenes-producto/
│   ├── 00-director-imagenes-producto.ts
│   ├── 01-ImageGallery.tsx
│   ├── 02-ImageDropzone.tsx
│   ├── 03-ImageThumb.tsx
│   └── 04-useImageGallery.ts
├── 22-pipeline-captura-imagen-producto/
│   ├── 00-director-captura-imagen-producto.ts
│   ├── 01-ImageUrlInput.tsx
│   ├── 02-useImageUrlEntry.ts
│   └── 03-useImagePicker.ts
├── 23-pipeline-seleccion-productos/
│   ├── 00-director-seleccion-productos.ts
│   ├── 01-ProductPicker.tsx
│   ├── 02-useProductPicker.ts
│   ├── 03-pricePort.ts
│   └── 04-commercial.ts
├── 24-pipeline-inventario-productos/
│   ├── 00-director-inventario-productos.ts
│   ├── 01-useProductActions.ts
│   ├── 02-useInventoryMetrics.ts
│   ├── 03-inventory.ts
│   ├── 04-reservationPort.ts
│   └── 05-modals.ts
├── 25-pipeline-persistencia-catalogo/
│   ├── 00-director-persistencia-catalogo.ts
│   ├── 01-store.ts
│   ├── 02-catalog.service.ts
│   ├── 03-taxonomy.ts
│   └── 04-types.ts
├── 26-pipeline-categorias-productos/
│   ├── 00-director-categorias-productos.ts
│   ├── 01-CategoriesPage.tsx
│   ├── 02-useTaxonomyPage.ts
│   ├── 03-useCategoriesTab.ts
│   ├── 04-useShowCategoryProducts.ts
│   └── 05-TaxonomyToolbar.tsx
├── 27-pipeline-edicion-categorias/
│   ├── 00-director-edicion-categorias.ts
│   ├── 01-CategoryFormModal.tsx
│   ├── 02-useCategoryForm.ts
│   └── 03-CategoryCard.tsx
├── 28-pipeline-marcas-productos/
│   ├── 00-director-marcas-productos.ts
│   ├── 01-BrandFormModal.tsx
│   ├── 02-useBrandForm.ts
│   ├── 03-useBrandsTab.ts
│   ├── 04-BrandRow.tsx
│   └── 05-BrandsTable.tsx
├── 29-pipeline-directorio-clientes/
│   ├── 00-director-directorio-clientes.ts
│   ├── 01-CustomersPage.tsx
│   ├── 02-useCustomers.ts
│   ├── 03-CustomersToolbar.tsx
│   └── 04-CustomerRow.tsx
├── 30-pipeline-registro-clientes/
│   ├── 00-director-registro-clientes.ts
│   ├── 01-CustomerFormModal.tsx
│   ├── 02-useCustomerForm.ts
│   ├── 03-customer.service.ts
│   └── 04-modals.ts
├── 31-pipeline-seleccion-clientes/
│   ├── 00-director-seleccion-clientes.ts
│   ├── 01-CustomerPicker.tsx
│   ├── 02-useCustomerSelection.ts
│   ├── 03-useCustomerCombobox.ts
│   ├── 04-CustomerSearch.tsx
│   └── 05-WalkinCustomerFields.tsx
├── 32-pipeline-identificacion-clientes/
│   ├── 00-director-identificacion-clientes.ts
│   ├── 01-CustomerOption.tsx
│   ├── 02-CustomerInitials.tsx
│   ├── 03-SelectedCustomerCard.tsx
│   └── 04-DuplicateCustomerNotice.tsx
├── 33-pipeline-historial-clientes/
│   ├── 00-director-historial-clientes.ts
│   ├── 01-store.ts
│   ├── 02-statsPort.ts
│   └── 03-types.ts
├── 34-pipeline-listado-pedidos/
│   ├── 00-director-listado-pedidos.ts
│   ├── 01-OrdersPage.tsx
│   ├── 02-usePaginatedOrders.ts
│   ├── 03-OrdersTable.tsx
│   ├── 04-OrderRow.tsx
│   └── 05-OrdersToolbar.tsx
├── 35-pipeline-consulta-pedidos/
│   ├── 00-director-consulta-pedidos.ts
│   ├── 01-useOrders.ts
│   ├── 02-filters.store.ts
│   ├── 03-orderSort.ts
│   ├── 04-OrderStatusTabs.tsx
│   └── 05-RecentOrdersTable.tsx
├── 36-pipeline-preparacion-pedidos/
│   ├── 00-director-preparacion-pedidos.ts
│   ├── 01-NewOrderPage.tsx
│   ├── 02-EditOrderPage.tsx
│   ├── 03-useOrderBuilder.ts
│   ├── 04-OrderDeliverySection.tsx
│   └── 05-OrderSummaryPanel.tsx
├── 37-pipeline-detalle-pedidos/
│   ├── 00-director-detalle-pedidos.ts
│   ├── 01-OrderDetailModal.tsx
│   ├── 02-useOrderDetail.ts
│   ├── 03-OrderLines.tsx
│   ├── 04-OrderTimeline.tsx
│   └── 05-OrderActionButtons.tsx
├── 38-pipeline-reserva-pedidos/
│   ├── 00-director-reserva-pedidos.ts
│   ├── 01-ReserveOrderModal.tsx
│   ├── 02-useReserveOrder.ts
│   ├── 03-useReservationExpiry.ts
│   ├── 04-reservation.ts
│   └── 05-ReservationTag.tsx
├── 39-pipeline-transiciones-pedidos/
│   ├── 00-director-transiciones-pedidos.ts
│   ├── 01-useOrderActions.ts
│   ├── 02-orderFlow.ts
│   ├── 03-stock.ts
│   ├── 04-OrderStatusBadge.tsx
│   └── 05-modals.ts
├── 40-pipeline-canales-venta/
│   ├── 00-director-canales-venta.ts
│   ├── 01-ChannelsTable.tsx
│   ├── 02-ChannelFormModal.tsx
│   ├── 03-useChannels.ts
│   └── 04-useChannelForm.ts
├── 41-pipeline-etapas-venta/
│   ├── 00-director-etapas-venta.ts
│   ├── 01-FlowTable.tsx
│   ├── 02-StatusLabelModal.tsx
│   └── 03-useFlowTable.ts
├── 42-pipeline-persistencia-pedidos/
│   ├── 00-director-persistencia-pedidos.ts
│   ├── 01-store.ts
│   ├── 02-order.service.ts
│   ├── 03-migrate.ts
│   ├── 04-orderSeed.ts
│   └── 05-types.ts
├── 43-pipeline-reglas-pedidos/
│   ├── 00-director-reglas-pedidos.ts
│   ├── 01-prefill.store.ts
│   ├── 02-orderValidation.ts
│   ├── 03-customerStats.ts
│   └── 04-charges.ts
├── 44-pipeline-listado-facturacion/
│   ├── 00-director-listado-facturacion.ts
│   ├── 01-BillingPage.tsx
│   ├── 02-useBilling.ts
│   ├── 03-BillingToolbar.tsx
│   ├── 04-InvoicesTable.tsx
│   └── 05-PendingOrdersTable.tsx
├── 45-pipeline-emision-facturas/
│   ├── 00-director-emision-facturas.ts
│   ├── 01-InvoiceEmitModal.tsx
│   ├── 02-useInvoiceEmit.ts
│   ├── 03-ReceptorFields.tsx
│   ├── 04-StockCheck.tsx
│   └── 05-modals.ts
├── 46-pipeline-documento-factura/
│   ├── 00-director-documento-factura.ts
│   ├── 01-InvoicePreviewModal.tsx
│   ├── 02-useInvoicePreview.ts
│   ├── 03-invoicePdf.ts
│   └── 04-InvoiceStatusBadge.tsx
├── 47-pipeline-persistencia-facturas/
│   ├── 00-director-persistencia-facturas.ts
│   ├── 01-store.ts
│   ├── 02-invoice.service.ts
│   └── 03-types.ts
├── 48-pipeline-listado-cotizaciones/
│   ├── 00-director-listado-cotizaciones.ts
│   ├── 01-QuotesPage.tsx
│   ├── 02-useQuotes.ts
│   ├── 03-QuoteRow.tsx
│   ├── 04-QuotesToolbar.tsx
│   └── 05-QuoteStatusBadge.tsx
├── 49-pipeline-preparacion-cotizaciones/
│   ├── 00-director-preparacion-cotizaciones.ts
│   ├── 01-NewQuotePage.tsx
│   ├── 02-useQuoteBuilder.ts
│   └── 03-QuoteSummaryPanel.tsx
├── 50-pipeline-documento-cotizacion/
│   ├── 00-director-documento-cotizacion.ts
│   ├── 01-QuotePreviewModal.tsx
│   ├── 02-useQuotePreview.ts
│   ├── 03-quotePdf.ts
│   └── 04-modals.ts
├── 51-pipeline-persistencia-cotizaciones/
│   ├── 00-director-persistencia-cotizaciones.ts
│   ├── 01-store.ts
│   ├── 02-quote.service.ts
│   └── 03-types.ts
├── 52-pipeline-listado-ofertas/
│   ├── 00-director-listado-ofertas.ts
│   ├── 01-PromotionsPage.tsx
│   ├── 02-useOffers.ts
│   ├── 03-OfferRow.tsx
│   └── 04-OffersToolbar.tsx
├── 53-pipeline-preparacion-ofertas/
│   ├── 00-director-preparacion-ofertas.ts
│   ├── 01-OfferBuilderPage.tsx
│   ├── 02-useOfferBuilder.ts
│   ├── 03-OfferPanel.tsx
│   └── 04-OfferProductList.tsx
├── 54-pipeline-precio-ofertas/
│   ├── 00-director-precio-ofertas.ts
│   ├── 01-useOfferPriceResolver.ts
│   ├── 02-offerPricing.ts
│   ├── 03-store.ts
│   └── 04-types.ts
├── 55-pipeline-moderacion-comentarios/
│   ├── 00-director-moderacion-comentarios.ts
│   ├── 01-InteractionsPage.tsx
│   ├── 02-useReviewModeration.ts
│   ├── 03-ReviewCard.tsx
│   ├── 04-ReviewsToolbar.tsx
│   └── 05-Stars.tsx
├── 56-pipeline-persistencia-comentarios/
│   ├── 00-director-persistencia-comentarios.ts
│   ├── 01-store.ts
│   ├── 02-reviews.service.ts
│   └── 03-types.ts
├── 57-pipeline-resumen-administrativo/
│   ├── 00-director-resumen-administrativo.ts
│   ├── 01-DashboardPage.tsx
│   ├── 02-useDashboardMetrics.ts
│   ├── 03-KpiGrid.tsx
│   └── 04-BranchBanner.tsx
├── 58-pipeline-seguimiento-comercial/
│   ├── 00-director-seguimiento-comercial.ts
│   ├── 01-QuickLinks.tsx
│   ├── 02-quickLinks.config.ts
│   ├── 03-RecentOrdersPanel.tsx
│   └── 04-StockHealthPanel.tsx
├── 59-pipeline-centro-ajustes/
│   ├── 00-director-centro-ajustes.ts
│   ├── 01-SettingsPage.tsx
│   ├── 02-useSettingsHub.ts
│   ├── 03-hub.config.ts
│   ├── 04-hub.future.ts
│   └── 05-SettingsHubCard.tsx
├── 60-pipeline-administracion-negocio/
│   ├── 00-director-administracion-negocio.ts
│   ├── 01-UsersPage.tsx
│   ├── 02-UserAccessPage.tsx
│   ├── 03-ChannelsPage.tsx
│   └── 04-useSettingsPageMeta.ts
├── 61-pipeline-identidad-comercial/
│   ├── 00-director-identidad-comercial.ts
│   ├── 01-IdentityPage.tsx
│   ├── 02-IdentityForm.tsx
│   ├── 03-IdentityFields.tsx
│   ├── 04-IdentityPreview.tsx
│   └── 05-useIdentityForm.ts
├── 62-pipeline-parametros-emisor/
│   ├── 00-director-parametros-emisor.ts
│   ├── 01-useStoreSettings.ts
│   ├── 02-store.ts
│   ├── 03-identity.ts
│   └── 04-invoiceNumberPort.ts
├── 63-pipeline-mantenimiento-datos/
│   ├── 00-director-mantenimiento-datos.ts
│   ├── 01-MaintenancePage.tsx
│   ├── 02-useMaintenance.ts
│   ├── 03-backup.ts
│   ├── 04-BackupCard.tsx
│   └── 05-ResetCard.tsx
├── 64-pipeline-parametros-fiscales/
│   ├── 00-director-parametros-fiscales.ts
│   ├── 01-FiscalPage.tsx
│   ├── 02-FiscalCards.tsx
│   └── 03-TaxpayerCard.tsx
├── 65-pipeline-campos-administrativos/
│   ├── 00-director-campos-administrativos.ts
│   ├── 01-Input.tsx
│   ├── 02-Textarea.tsx
│   ├── 03-Select.tsx
│   ├── 04-Field.tsx
│   └── 05-controlStyles.ts
├── 66-pipeline-acciones-administrativas/
│   ├── 00-director-acciones-administrativas.ts
│   ├── 01-Button.tsx
│   ├── 02-IconButton.tsx
│   ├── 03-FormActions.tsx
│   └── 04-Checkbox.tsx
├── 67-pipeline-indicadores-administrativos/
│   ├── 00-director-indicadores-administrativos.ts
│   ├── 01-Badge.tsx
│   ├── 02-Avatar.tsx
│   ├── 03-KpiCard.tsx
│   └── 04-ProgressBar.tsx
├── 68-pipeline-marcos-contenido/
│   ├── 00-director-marcos-contenido.ts
│   ├── 01-PageContainer.tsx
│   ├── 02-Card.tsx
│   ├── 03-EmptyState.tsx
│   └── 04-AffixInput.tsx
├── 69-pipeline-navegacion-listados/
│   ├── 00-director-navegacion-listados.ts
│   ├── 01-ListToolbar.tsx
│   ├── 02-LiveSearch.tsx
│   ├── 03-SegmentedTabs.tsx
│   ├── 04-BackLink.tsx
│   └── 05-Breadcrumb.tsx
├── 70-pipeline-orden-paginacion/
│   ├── 00-director-orden-paginacion.ts
│   ├── 01-DataTable.tsx
│   ├── 02-SortHeaderButton.tsx
│   ├── 03-Pagination.tsx
│   ├── 04-usePagination.ts
│   └── 05-pagination.ts
├── 71-pipeline-seleccion-fechas/
│   ├── 00-director-seleccion-fechas.ts
│   ├── 01-DatePicker.tsx
│   ├── 02-Calendar.tsx
│   ├── 03-useCalendar.ts
│   ├── 04-useAnchoredPopover.ts
│   └── 05-date.ts
├── 72-pipeline-confirmaciones-globales/
│   ├── 00-director-confirmaciones-globales.ts
│   ├── 01-ConfirmDialog.tsx
│   ├── 02-useConfirmDialog.ts
│   └── 03-confirm.store.ts
├── 73-pipeline-modales-globales/
│   ├── 00-director-modales-globales.ts
│   ├── 01-Modal.tsx
│   ├── 02-useEscapeKey.ts
│   └── 03-modal.store.ts
├── 74-pipeline-tema-administrativo/
│   ├── 00-director-tema-administrativo.ts
│   ├── 01-useTheme.ts
│   ├── 02-theme.store.ts
│   ├── 03-Switch.tsx
│   └── 04-SwitchField.tsx
├── 75-pipeline-estado-navegacion/
│   ├── 00-director-estado-navegacion.ts
│   ├── 01-usePageMeta.ts
│   ├── 02-pageMeta.store.ts
│   └── 03-layout.store.ts
├── 76-pipeline-avisos-globales/
│   ├── 00-director-avisos-globales.ts
│   ├── 01-Toaster.tsx
│   ├── 02-toast.store.ts
│   ├── 03-useToggle.ts
│   └── 04-useTabs.ts
├── 77-pipeline-edicion-formularios/
│   ├── 00-director-edicion-formularios.ts
│   ├── 01-LineItemsEditor.tsx
│   ├── 02-useLineItems.ts
│   └── 03-useFormState.ts
├── 78-pipeline-cargos-documentos/
│   ├── 00-director-cargos-documentos.ts
│   ├── 01-ExtraChargesEditor.tsx
│   ├── 02-useExtraCharges.ts
│   └── 03-charges.ts
├── 79-pipeline-consulta-documentos/
│   ├── 00-director-consulta-documentos.ts
│   ├── 01-PdfPreviewModal.tsx
│   ├── 02-usePdfDocument.ts
│   ├── 03-pdf.ts
│   └── 04-numberToWords.ts
├── 80-pipeline-galeria-imagenes/
│   ├── 00-director-galeria-imagenes.ts
│   ├── 01-ImageLightbox.tsx
│   ├── 02-LightboxToolbar.tsx
│   ├── 03-LightboxThumbnails.tsx
│   └── 04-useLightbox.ts
├── 81-pipeline-visualizacion-imagenes/
│   ├── 00-director-visualizacion-imagenes.ts
│   ├── 01-SafeImage.tsx
│   ├── 02-useImageViewer.ts
│   ├── 03-useImageZoom.ts
│   ├── 04-image.ts
│   └── 05-initialsAvatar.ts
├── 82-pipeline-calculo-importes/
│   ├── 00-director-calculo-importes.ts
│   ├── 01-pricing.ts
│   ├── 02-currency.ts
│   └── 03-sort.ts
├── 83-pipeline-recursos-publicos/
│   ├── 00-director-recursos-publicos.ts
│   ├── 01-publicUrl.ts
│   ├── 02-cn.ts
│   ├── 03-events.ts
│   └── 04-whatsapp.ts
├── 84-pipeline-persistencia-demo/
│   ├── 00-director-persistencia-demo.ts
│   ├── 01-demoData.ts
│   ├── 02-storage.ts
│   ├── 03-download.ts
│   └── 04-delay.ts
├── 85-pipeline-identificadores-texto/
│   ├── 00-director-identificadores-texto.ts
│   ├── 01-text.ts
│   ├── 02-uid.ts
│   └── 03-store.config.ts
├── 86-pipeline-datos-demo-personas/
│   ├── 00-director-datos-demo-personas.ts
│   ├── 01-roles.mock.ts
│   ├── 02-users.mock.ts
│   ├── 03-customers.mock.ts
│   └── 04-reviews.mock.ts
├── 87-pipeline-datos-demo-productos/
│   ├── 00-director-datos-demo-productos.ts
│   ├── 01-products.mock.ts
│   ├── 02-categories.mock.ts
│   ├── 03-brands.mock.ts
│   └── 04-promotions.mock.ts
├── 88-pipeline-datos-demo-documentos/
│   ├── 00-director-datos-demo-documentos.ts
│   ├── 01-orders.mock.ts
│   ├── 02-channels.mock.ts
│   ├── 03-invoices.mock.ts
│   └── 04-quotes.mock.ts
└── main.tsx
```

| Rango | Dominio / responsabilidad | Pipelines |
|---|---|---|
| `01–04` | Aplicación, rutas, marco, navegación y cabecera | 4 |
| `05–11` | Acceso, sesión, permisos, usuarios y contraseñas | 7 |
| `12–28` | Catálogo, formularios, imágenes, inventario, categorías y marcas | 17 |
| `29–33` | Clientes, registro, selección e historial | 5 |
| `34–43` | Pedidos, preparación, detalle, reservas, canales, flujo y persistencia | 10 |
| `44–47` | Facturación, emisión y documentos | 4 |
| `48–51` | Cotizaciones, preparación, documentos y persistencia | 4 |
| `52–54` | Ofertas y precio vigente | 3 |
| `55–56` | Moderación y persistencia de comentarios | 2 |
| `57–58` | Tablero y seguimiento comercial | 2 |
| `59–64` | Ajustes, identidad, administración, mantenimiento y fiscal | 6 |
| `65–85` | Interacción y contratos transversales existentes | 21 |
| `86–88` | Datos demo de personas, productos y documentos | 3 |

Cada director nuevo contiene una sola reexportación, sin cargar fases adicionales ni cambiar el orden de inicialización. Los directores raíz conservan las API públicas anteriores. Las fases ya relacionadas siguen usando sus dependencias existentes como excepción explícita al aislamiento. Los módulos desactivados se conservan; el directorio de documentación histórica no es un pipeline ejecutable y no está sujeto al límite de archivos.

---

## 6. Directorio de vistas

Acceso: cada usuario ve las vistas habilitadas en sus Accesos (§4). Columna "Plantillas": roles cuya plantilla incluye la vista.

Los nombres access, catalog, sales, etc. identifican los dominios lógicos originales y las claves de persistencia; sus ubicaciones físicas son los pipelines de §5.

| Ruta | Página | Dominio | Plantillas |
|---|---|---|---|
| `/login` | LoginPage | access | público |
| `/tablero` | DashboardPage | dashboard | super, gerencia, admin |
| `/productos` | ProductsPage | catalog | todos |
| `/pedidos` · `/nuevo` · `/:orderId/editar` | OrdersPage · NewOrderPage · EditOrderPage | sales | todos |
| `/facturacion` | BillingPage | billing | super, gerencia, admin, caja |
| `/clientes` | CustomersPage | customers | todos |
| `/categorias` (`?tab=marcas`) | CategoriesPage | catalog | super, gerencia, admin |
| `/ofertas` · `/nueva` · `/:offerId/editar` | PromotionsPage · OfferBuilderPage | promotions | super, gerencia, admin |
| `/cotizaciones` · `/nueva` | QuotesPage · NewQuotePage | quotes | super, gerencia, admin, servicio |
| `/interacciones` | InteractionsPage (Comentarios) | interactions | super, gerencia, admin, servicio |
| `/ajustes` (+ `canales`, `usuarios`, `usuarios/:userId/accesos`, `identidad`) | SettingsPage y subpáginas | settings | super |
| `*` | NotFoundPage | app | — |

- **Navegación:** Ajustes no está en el sidebar; tiene atajo en la topbar junto al tema (`placement: 'topbar'` en `src/03-pipeline-navegacion-administrativa/05-nav.config.ts`). Cerrar sesión pide confirmación.
- **Redirección:** `/` y las vistas no permitidas llevan a la primera vista habilitada del usuario.
- **Desactivadas:** `ajustes/parametros` y `ajustes/mantenimiento` (código conservado, sin ruta ni tarjeta). Motivo y reactivación: `src/00-documentacion/16-settings-ESCALABILIDAD.md`.

---

## 7. Puertos entre dominios (inversión de dependencias)

| Puerto (declara) | Implementa | Para qué |
|---|---|---|
| `src/33-pipeline-historial-clientes/02-statsPort.ts` (`provideCustomerStats`) | `sales` | Métricas de compra por cliente sin que Clientes importe Pedidos |
| `src/24-pipeline-inventario-productos/04-reservationPort.ts` (`provideReservedStock`) | `sales` | Unidades reservadas por producto, visibles en Productos (`ReservedBadge`) |
| `src/23-pipeline-seleccion-productos/03-pricePort.ts` (`provideEffectivePrice`, `useEffectivePrice`) | `promotions` | **Precio vigente** (con oferta) para el selector de productos, Pedidos y Cotizaciones |
| `src/62-pipeline-parametros-emisor/04-invoiceNumberPort.ts` (`provideLastInvoiceNumber`) | `billing` | Último correlativo emitido, visible en Ajustes › Identidad junto a la semilla |
| `src/84-pipeline-persistencia-demo/01-demoData.ts` (`registerDemoData`) | stores (quotes, interactions…) | Respaldo y restablecimiento sin que Ajustes importe cada dominio |

Los proveedores de reservas y métricas se registran en `src/00-director-ventas.ts`; el de precio, en `src/00-director-ofertas.ts`; y el correlativo, en `src/00-director-facturacion.ts`. `registerDemoData` conserva sus registros en los stores. Sin proveedor, cada puerto conserva su valor neutro anterior.

---

## 8. Flujos y reglas de negocio

| Flujo | Reglas clave | Dónde |
|---|---|---|
| **Pedidos** | Registrar → **Confirmar y reservar** (estado *Reservado*) → Facturar (descuenta) → Entregar · Cancelar antes de facturar. Editables y eliminables solo **sin factura**. Eliminación **lógica** (`deletedOrders` + motivo); el id nunca se reutiliza. Forma de pago: Efectivo/Transferencia (valores retirados se conservan como "(anterior)"). | `src/39-pipeline-transiciones-pedidos/02-orderFlow.ts`, `src/42-pipeline-persistencia-pedidos/01-store.ts` |
| **Reserva** | Modal con calendario propio: vigencia por defecto 3 días, máx. 15, vence a las 23:59 del día elegido. Aparta stock (disponible = stock − reservas **vigentes**); disponible 0 = no se agrega a otros pedidos y se oculta en el Front Office (regla documentada en `store/src/features/catalog/lib/reservations.api.ts`). Al vencer sin facturar, el barrido (`useReservationExpiry`, al abrir el panel y cada minuto) devuelve el pedido a Registrado. Anular factura = re-reserva por 3 días. | `src/38-pipeline-reserva-pedidos/04-reservation.ts`, `src/38-pipeline-reserva-pedidos/02-useReserveOrder.ts` |
| **Cliente en pedido** | Buscador accesible; "Cliente nuevo" se da de alta en el directorio al registrar (valida DUI/NIT, teléfono duplicado → "Usar este cliente"). Cotizaciones mantienen "cliente ocasional". | `src/31-pipeline-seleccion-clientes/02-useCustomerSelection.ts` |
| **Cargos extra** | Envío, instalación… (concepto + monto, máx. 6, ≤ $2 000). Suman al total; pasan de cotización a pedido y a factura como líneas **Servicio** que **nunca mueven inventario**. | `src/78-pipeline-cargos-documentos/03-charges.ts`, `src/47-pipeline-persistencia-facturas/02-invoice.service.ts` |
| **Ofertas** | Capa de precio (no modifica `Product.price`). % o monto fijo, vigencia por fechas + pausa. **Bloquea** precio bajo costo; advierte margen < 5 %; sin solapamientos por producto. | `src/54-pipeline-precio-ofertas/02-offerPricing.ts` |
| **Categorías y marcas** | Nombres únicos (sin tildes/mayúsculas); slug fijo; no se elimina con productos; renombrar marca actualiza sus productos; marca inactiva no se ofrece en productos nuevos. | `src/25-pipeline-persistencia-catalogo/03-taxonomy.ts` |
| **Canales y flujo** | Canal con pedidos no se elimina (se desactiva); renombrar actualiza pedidos. Del flujo solo se editan nombre y descripción; transiciones y efectos son fijos. | `src/42-pipeline-persistencia-pedidos/02-order.service.ts`, `src/39-pipeline-transiciones-pedidos/02-orderFlow.ts` |
| **Comentarios** | Pendiente → Publicado / Rechazado (motivo interno) · Eliminar. Señales de posible spam. | `src/56-pipeline-persistencia-comentarios/02-reviews.service.ts` |
| **Búsqueda en tiempo real** | `LiveSearch` + `matchesQuery`: cada palabra debe aparecer en algún campo (AND entre palabras), sin tildes/mayúsculas, teléfonos con o sin guion; se combina con pestañas/filtros y vuelve a la página 1. Pedidos (`orderSearchFields`, se conserva al volver de editar), Facturación (por pestaña; `invoiceSearchFields`), Ofertas y Cotizaciones (`filterQuotes`). | `src/85-pipeline-identificadores-texto/01-text.ts` |
| **Identidad del emisor** | Datos de encabezado y bloque DTE (razón social, NIT, NRC, giro, establecimiento) validados; IVA no editable; aplica a documentos futuros. **Semilla del correlativo** de facturas (`invoiceSeed`): solo adelanta la numeración; rige `max(semilla, último emitido + 1)` y nunca se reutiliza un número (incluye anuladas). | `src/62-pipeline-parametros-emisor/03-identity.ts` |

---

## 9. Inventario de componentes

| Dominio | Componentes | Hooks |
|---|---|---|
| **access** | LoginCard, ChangePasswordScreen, UsersSection/UserRow, UserFormModal, ResetPasswordModal, AccessSummaryBar, AccessSidebar, ViewActionsPanel, RoleBadge | useSession, useLoginForm, useAccessActions, useUsersAdmin, useUserForm, useUserAccess |
| **catalog** | ProductToolbar, ProductGrid/Card, ProductTable, ProductFormModal (tabs), ProductDetailModal, ProductPicker, StockBadge, ReservedBadge, TaxonomyToolbar, CategoryCard, BrandsTable/Row, Category/BrandFormModal | useFilteredProducts, useProductForm, useProductPicker, useTaxonomyPage, useCategoriesTab, useBrandsTab, useCategoryForm, useBrandForm |
| **customers** | CustomerRow/FormModal, CustomerPicker (CustomerSearch, SelectedCustomerCard, WalkinCustomerFields, DuplicateCustomerNotice) | useCustomers, useCustomerSelection, useCustomerCombobox |
| **sales** | OrdersToolbar, OrdersTable/Row (fila clickable, columnas ordenables), OrderSummaryPanel, OrderDetailModal, ReserveOrderModal, ReservationTag, ChannelsTable, ChannelFormModal, FlowTable, StatusLabelModal | useOrders, useOrderBuilder, useOrderActions, useOrderDetail, usePaginatedOrders, useReserveOrder, useReservationExpiry, useChannels, useFlowTable |
| **billing** | BillingToolbar, InvoicesTable, PendingOrdersTable, InvoiceEmitModal (StockCheck), InvoicePreviewModal | useBilling, useInvoiceEmit, useInvoicePreview |
| **quotes** | QuotesToolbar, QuoteRow, QuoteSummaryPanel, QuotePreviewModal | useQuotes, useQuoteBuilder, useQuotePreview |
| **promotions** | OffersToolbar, OfferRow, OfferPanel, OfferProductList | useOffers, useOfferBuilder, useOfferPriceResolver |
| **interactions** | ReviewCard, ReviewsToolbar, Stars | useReviewModeration |
| **shared (destacados)** | ListToolbar, LiveSearch, SegmentedTabs, BackLink, Calendar, DatePicker, Breadcrumb (solo Topbar), DataTable (ordenable), ExtraChargesEditor, LineItemsEditor, ConfirmDialog (motivo opcional) | useCalendar, useAnchoredPopover, usePageMeta, useExtraCharges, useLineItems, usePagination |
| **dashboard · settings** | KpiGrid, StockHealthPanel, QuickLinks · SettingsHubCard, IdentityForm/Fields/Preview | useDashboardMetrics · useSettingsHub, useSettingsPageMeta, useIdentityForm, useStoreSettings |

Los modales se abren desde el store global (`modal.store`); las confirmaciones usan el `ConfirmDialog` global (admite motivo obligatorio).

---

## 10. Persistencia y migraciones

| Store (`localStorage`) | Versión | Último cambio |
|---|---|---|
| `access` | v5 | Acción `canReserveOrders` (se otorga a quien ya gestionaba pedidos) · v4: accesos por usuario; Super Administrador = Administrador de Sistema (el dueño pasa a Gerencia; se agrega `sistemas@` si no hay superadmin activo) |
| `catalog` | v4 | Marcas como entidad (derivadas de las marcas escritas en productos) |
| `sales` | v4 | Vigencia de reserva (`reservedUntil`; los reservados reciben 3 días) · v3: cargos extra; `deletedOrders` y `statusLabels` por defecto al hidratar |
| `quotes` | v1 | Cargos extra |
| `promotions` | v1 | Campañas por categoría → ofertas **pausadas** con los productos de la categoría |
| `interactions` | — | Store nuevo (comentarios) |

Regla: nunca descartar datos guardados; completar con valores por defecto y documentar el cambio en el comentario del store.

---

## 11. Cómo respetar las 150 líneas

- **Tarjetas grandes** → `Media`, `Body`, `Footer`.
- **Tablas** → `DataTable` + filas (`*Row.tsx`).
- **Formularios** → `useXForm.ts` (lógica), `XFields.tsx` (campos), `XFormModal.tsx` / `XForm.tsx` (contenedor).
- **Listas repetitivas** (nav, KPI, hub, vistas de Accesos) → `config.ts` + `.map()`.

Conservar los prefijos de fase al crear archivos. Si un pipeline supera seis archivos, crear otro pipeline paralelo y coordinar su entrada desde la raíz, respetando las excepciones documentadas.

---

## 12. Verificación

1. Desde admin/: `pnpm exec tsc -b --force --pretty false`, `pnpm lint` y `pnpm build` deben terminar sin errores. Se conserva el aviso previo de Vite por el tamaño del bundle.
2. Ejecutar `node --test --test-isolation=none tests/traceability.test.mjs`: siete comprobaciones, sin instalar librerías ni modificar scripts del package.json. Repetir al mover/renombrar fases o cambiar el helper.
3. Mantener ≤ 150 líneas por `.tsx`; los límites se aplican a los archivos numerados de todos los pipelines. La instrumentación existente mantiene sus IDs, componentes y puntos de aplicación.
4. En un build con `VITE_UI_TRACEABILITY=true`, inspeccionar `[data-ui-id],[data-ui-component],[data-ui-source]`: cada nodo instrumentado tiene los tres atributos y su ruta source existe. En un build con `false`, ese selector debe devolver cero nodos, también con modales y portales abiertos.
5. Auditoría 2026-11-12: 23 escenarios en Chrome con `true` y los mismos 23 con `false` (46 en total), con perfil temporal y datos demo. Incluyen login, los diez dominios, formularios nuevos, accesos de usuario, detalle de producto, galería en portal y calendario en portal. Sin excepciones JavaScript; cero nodos con metadata en el build desactivado.
6. Se comparó cada archivo de src/ con el cierre de la migración: solo cambiaron las 139 rutas de metadata y comentarios del helper; estilos, JSX, IDs, nombres de componentes, lógica, mocks y esquemas persistidos permanecen intactos. La hoja CSS generada conserva el mismo SHA-256. El JS cambia por las rutas source actualizadas.
7. Para cambios futuros de negocio, probar los esquemas persistidos y los flujos afectados: pedido con cargos → reservar → facturar → anular → vencer → eliminar; ofertas; correlativo; RBAC; alta de cliente. Esta auditoría de trazabilidad no reejecuta ni sustituye una regresión completa de esos flujos.

---

## 13. Pendientes conocidos

- **Integración API pendiente:** el Front Office no envía aún comentarios al admin (contrato en `store/src/features/catalog/lib/reviews.api.ts`); respaldo y restablecimiento están desactivados con Ajustes › Mantenimiento.
- **Bundle principal ≈ 741 kB** (aviso de Vite > 500 kB): candidato a carga diferida de rutas (`React.lazy`) por feature.
- **Reservas en el Front Office:** el ocultamiento por disponible 0 está documentado pero no conectado (falta la API); el vencimiento lo hace el navegador (en producción: tarea del servidor).
- **Sello DTE simulado** en facturación (integración con Hacienda pendiente).
- Ofertas: sin descuento distinto por producto ni borradores.
- **Datos de ejemplo con fechas fijas** (nov-2026): cuando el reloj pase las fechas de reserva de los pedidos demo, el barrido los devolverá a Registrado al cargar (comportamiento esperado).
- Pruebas automatizadas de trazabilidad en `tests/traceability.test.mjs`; la regresión completa de negocio sigue sin suite automatizada. No se añadieron dependencias ni un framework de pruebas.
- No hay vista para consultar o restaurar pedidos eliminados (los datos se conservan en `deletedOrders`).
