# Reestructuración FLOA de admin

## Alcance y fuente de verdad

- Rama: `refactor/floa-admin`; base: `c518624`.
- Alcance: exclusivamente `admin/src/` y este reporte (`admin/REFACTOR_MAP.md`).
- Fuente leída completa: `/home/vmz/Descargas/Copia de arq.md`. Sus propuestas de lógica nueva quedan subordinadas a la prohibición de cambios funcionales de la tarea.
- Sin cambios en dependencias, lockfile, configuración Vite/TypeScript/ESLint, recursos públicos, otro frontend o API.
- Inventario: 404 archivos originales, 88 pipelines planos de 4–6 archivos (incluido el director), 88 directores nuevos de una sola reexportación.
- `main.tsx` conserva su ubicación; solo cambian sus imports. Los contratos generales y el orquestador quedan en la raíz de `src/`.

## Línea base

| Comprobación | Comando | Resultado |
| --- | --- | --- |
| Instalación | `pnpm install --frozen-lockfile --store-dir /tmp/floa-admin/pnpm-store --reporter append-only` | 0; versiones fijadas por el lockfile |
| Typecheck | `pnpm exec tsc -b --pretty false` | 0 |
| Lint | `pnpm lint` | 0 |
| Build | `pnpm build` | 0; aviso existente de chunks mayores de 500 kB |
| Tests | Sin script de tests ni archivos de pruebas en admin | No aplicable |

Instalación inicial: `pnpm install --frozen-lockfile --offline` terminó con código 1 (tarball de scheduler ausente). El intento dentro del sandbox sin conexión terminó por límite de 45 s (código 124, DNS). La instalación con acceso de red terminó correctamente; no se alteró el lockfile. La caché creada accidentalmente en la raíz se eliminó antes de iniciar la migración.

Los registros completos y las herramientas temporales de auditoría están en `/tmp/floa-admin/`; no forman parte del frontend ni añaden dependencias.

## Ejecución incremental

Cada fila corresponde a un paso y un commit independiente. Después de mover se comparan el contenido y el grafo con la línea base, y se ejecutan typecheck y build. Ante un fallo se restaura inmediatamente el commit anterior; los pasos dependientes se detienen.

| Paso | Estado | Typecheck | Build | Auditoría de contenido/imports |
| --- | --- | --- | --- | --- |
| raiz | pendiente | pendiente | pendiente | pendiente |
| datos-mock | pendiente | pendiente | pendiente | pendiente |
| transversal | pendiente | pendiente | pendiente | pendiente |
| aplicacion | pendiente | pendiente | pendiente | pendiente |
| acceso | pendiente | pendiente | pendiente | pendiente |
| catalogo | pendiente | pendiente | pendiente | pendiente |
| clientes | pendiente | pendiente | pendiente | pendiente |
| ventas | pendiente | pendiente | pendiente | pendiente |
| facturacion | pendiente | pendiente | pendiente | pendiente |
| cotizaciones | pendiente | pendiente | pendiente | pendiente |
| ofertas | pendiente | pendiente | pendiente | pendiente |
| interacciones | pendiente | pendiente | pendiente | pendiente |
| tablero | pendiente | pendiente | pendiente | pendiente |
| ajustes | pendiente | pendiente | pendiente | pendiente |

## Decisiones conservadoras y conflictos con FLOA

1. **Aislamiento absoluto y llamadas entre fases:** el código estabilizado ya importa contratos compartidos, estados, tipos y fases de otros flujos. Eliminarlos exige cambiar la composición o la lógica. Se conserva exactamente el grafo original de 1487 referencias locales, insertando únicamente fachadas de reexportación de una sola fase. Los contratos públicos originales se renombran como directores raíz. No se crean buses, contenedores ni barriles que carguen fases adicionales. Por ello la topología es FLOA, pero el aislamiento absoluto y el acceso exclusivo a toda fase por su director quedan como excepciones explícitas; no se simula aislamiento mediante rutas indirectas.
2. **Orden de inicialización:** los registros existentes de los puertos de reservas, métricas de clientes, precios y correlativos permanecen intactos en sus antiguos índices, ahora directores raíz. Cada director nuevo reexporta un único módulo ya consumido, sin llamadas ni inicialización propia; al contraer esas fachadas, cada referencia resuelve al mismo módulo original y en el mismo orden.
3. **Trazabilidad:** se mantienen literalmente todos los `tracer(...)`, metadatos `source`, comentarios y cadenas `src/...` no usadas como imports. Actualizarlos cambiaría la salida observable y excedería lo permitido. El mapa permite localizar las nuevas rutas.
4. **Datos de ejemplo:** los doce módulos mock constituyen tres pipelines del dominio de datos demo. Solo cambian sus rutas de import/export, cuando existen; valores, fechas, orden, claves y persistencia permanecen intactos.
5. **Código conservado:** los módulos ya desconectados y vistas desactivadas se conservan. Los HTML históricos y ESCALABILIDAD.md se trasladan sin editar a `00-documentacion/`, fuera de los pipelines ejecutables. No se elimina código ni se activa funcionalidad.
6. **R.D.A. y nuevas abstracciones:** no se agregan try/catch, fallbacks, Event Bus, asincronía ni cambios CSS/JSX. Los límites numéricos obligan a dividir los dominios grandes en pipelines paralelos; no hay subcarpetas dentro de ellos.

Referencias preexistentes entre archivos asignados a pipelines distintos (incluyen tipos y utilidades; no se añaden dependencias de negocio):

| Dominio de origen | Referencias preservadas |
| --- | --- |
| Aplicación y navegación | 21 |
| Acceso y usuarios | 75 |
| Catálogo e inventario | 176 |
| Clientes | 40 |
| Ventas y pedidos | 139 |
| Facturación | 43 |
| Cotizaciones | 45 |
| Ofertas | 26 |
| Comentarios | 13 |
| Tablero | 5 |
| Ajustes | 24 |
| Contratos compartidos existentes | 59 |
| Datos mock / dummy | 17 |

Módulos sin importadores ya presentes en la línea base (se conservan; no son archivos perdidos por la migración):

- `shared/hooks/index.ts` → `00-director-interaccion.ts`
- `shared/store/index.ts` → `00-director-estado.ts`
- `shared/lib/index.ts` → `00-director-utilidades.ts`
- `features/settings/config/hub.future.ts` → `59-pipeline-centro-ajustes/04-hub.future.ts`
- `features/settings/pages/MaintenancePage.tsx` → `63-pipeline-mantenimiento-datos/01-MaintenancePage.tsx`
- `features/settings/pages/FiscalPage.tsx` → `64-pipeline-parametros-fiscales/01-FiscalPage.tsx`

## Mapa ruta actual → ruta nueva

Todas las rutas de las tablas son relativas a `admin/src/`. Las filas «creado» son fachadas puras; su referencia apunta a una fase ya existente, sin lógica nueva.

### Raíz y contratos de integración

| Ruta actual | Ruta nueva |
| --- | --- |
| `main.tsx` | `main.tsx` |
| `env.d.ts` | `00-entorno.d.ts` |
| `App.tsx` | `00-orquestador-principal.tsx` |
| `index.css` | `00-estilos-globales.css` |
| `ui-traceability/index.ts` | `00-trazabilidad.ts` |
| `features/access/index.ts` | `00-director-acceso.ts` |
| `features/catalog/index.ts` | `00-director-catalogo.ts` |
| `features/customers/index.ts` | `00-director-clientes.ts` |
| `features/sales/index.ts` | `00-director-ventas.ts` |
| `features/billing/index.ts` | `00-director-facturacion.ts` |
| `features/quotes/index.ts` | `00-director-cotizaciones.ts` |
| `features/promotions/index.ts` | `00-director-ofertas.ts` |
| `features/interactions/index.ts` | `00-director-interacciones.ts` |
| `features/dashboard/index.ts` | `00-director-tablero.ts` |
| `features/settings/index.ts` | `00-director-ajustes.ts` |
| `shared/ui/index.ts` | `00-director-interfaz.ts` |
| `shared/hooks/index.ts` | `00-director-interaccion.ts` |
| `shared/store/index.ts` | `00-director-estado.ts` |
| `shared/lib/index.ts` | `00-director-utilidades.ts` |

### Aplicación y navegación

#### 01-pipeline-rutas-protegidas

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `01-pipeline-rutas-protegidas/01-router.tsx` | `01-pipeline-rutas-protegidas/00-director-rutas-protegidas.ts` |
| `app/router.tsx` | `01-pipeline-rutas-protegidas/01-router.tsx` |
| `app/guards/RequireAuth.tsx` | `01-pipeline-rutas-protegidas/02-RequireAuth.tsx` |
| `app/guards/RequireView.tsx` | `01-pipeline-rutas-protegidas/03-RequireView.tsx` |
| `app/guards/HomeRedirect.tsx` | `01-pipeline-rutas-protegidas/04-HomeRedirect.tsx` |
| `app/pages/NotFoundPage.tsx` | `01-pipeline-rutas-protegidas/05-NotFoundPage.tsx` |

#### 02-pipeline-marco-administrativo

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `02-pipeline-marco-administrativo/01-AdminLayout.tsx` | `02-pipeline-marco-administrativo/00-director-marco-administrativo.ts` |
| `app/layout/AdminLayout.tsx` | `02-pipeline-marco-administrativo/01-AdminLayout.tsx` |
| `app/hooks/useLayout.ts` | `02-pipeline-marco-administrativo/02-useLayout.ts` |
| `app/RootLayout.tsx` | `02-pipeline-marco-administrativo/03-RootLayout.tsx` |
| `app/Overlays.tsx` | `02-pipeline-marco-administrativo/04-Overlays.tsx` |
| `app/ModalHost.tsx` | `02-pipeline-marco-administrativo/05-ModalHost.tsx` |

#### 03-pipeline-navegacion-administrativa

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `03-pipeline-navegacion-administrativa/01-Sidebar.tsx` | `03-pipeline-navegacion-administrativa/00-director-navegacion-administrativa.ts` |
| `app/layout/sidebar/Sidebar.tsx` | `03-pipeline-navegacion-administrativa/01-Sidebar.tsx` |
| `app/layout/sidebar/SidebarNavItem.tsx` | `03-pipeline-navegacion-administrativa/02-SidebarNavItem.tsx` |
| `app/layout/sidebar/SidebarProfile.tsx` | `03-pipeline-navegacion-administrativa/03-SidebarProfile.tsx` |
| `app/hooks/useNavItems.ts` | `03-pipeline-navegacion-administrativa/04-useNavItems.ts` |
| `app/nav.config.ts` | `03-pipeline-navegacion-administrativa/05-nav.config.ts` |

#### 04-pipeline-cabecera-administrativa

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `04-pipeline-cabecera-administrativa/01-Topbar.tsx` | `04-pipeline-cabecera-administrativa/00-director-cabecera-administrativa.ts` |
| `app/layout/topbar/Topbar.tsx` | `04-pipeline-cabecera-administrativa/01-Topbar.tsx` |
| `app/layout/topbar/TopbarTitle.tsx` | `04-pipeline-cabecera-administrativa/02-TopbarTitle.tsx` |
| `app/layout/topbar/TopbarShortcut.tsx` | `04-pipeline-cabecera-administrativa/03-TopbarShortcut.tsx` |
| `app/layout/topbar/ThemeToggle.tsx` | `04-pipeline-cabecera-administrativa/04-ThemeToggle.tsx` |


### Acceso y usuarios

#### 05-pipeline-inicio-sesion

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `05-pipeline-inicio-sesion/01-LoginPage.tsx` | `05-pipeline-inicio-sesion/00-director-inicio-sesion.ts` |
| `features/access/pages/LoginPage.tsx` | `05-pipeline-inicio-sesion/01-LoginPage.tsx` |
| `features/access/hooks/useLoginForm.ts` | `05-pipeline-inicio-sesion/02-useLoginForm.ts` |
| `features/access/components/login/LoginCard.tsx` | `05-pipeline-inicio-sesion/03-LoginCard.tsx` |
| `features/access/components/login/DemoCredentials.tsx` | `05-pipeline-inicio-sesion/04-DemoCredentials.tsx` |

#### 06-pipeline-sesion-permisos

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `06-pipeline-sesion-permisos/01-useSession.ts` | `06-pipeline-sesion-permisos/00-director-sesion-permisos.ts` |
| `features/access/hooks/useSession.ts` | `06-pipeline-sesion-permisos/01-useSession.ts` |
| `features/access/lib/permissions.ts` | `06-pipeline-sesion-permisos/02-permissions.ts` |
| `features/access/lib/access.ts` | `06-pipeline-sesion-permisos/03-access.ts` |
| `features/access/store.ts` | `06-pipeline-sesion-permisos/04-store.ts` |
| `features/access/types.ts` | `06-pipeline-sesion-permisos/05-types.ts` |

#### 07-pipeline-administracion-usuarios

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `07-pipeline-administracion-usuarios/01-UsersSection.tsx` | `07-pipeline-administracion-usuarios/00-director-administracion-usuarios.ts` |
| `features/access/components/users/UsersSection.tsx` | `07-pipeline-administracion-usuarios/01-UsersSection.tsx` |
| `features/access/hooks/useUsersAdmin.ts` | `07-pipeline-administracion-usuarios/02-useUsersAdmin.ts` |
| `features/access/hooks/useAccessActions.ts` | `07-pipeline-administracion-usuarios/03-useAccessActions.ts` |
| `features/access/components/users/UserRow.tsx` | `07-pipeline-administracion-usuarios/04-UserRow.tsx` |
| `features/access/components/RoleBadge.tsx` | `07-pipeline-administracion-usuarios/05-RoleBadge.tsx` |

#### 08-pipeline-edicion-usuarios

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `08-pipeline-edicion-usuarios/01-UserFormModal.tsx` | `08-pipeline-edicion-usuarios/00-director-edicion-usuarios.ts` |
| `features/access/components/users/UserFormModal.tsx` | `08-pipeline-edicion-usuarios/01-UserFormModal.tsx` |
| `features/access/hooks/useUserForm.ts` | `08-pipeline-edicion-usuarios/02-useUserForm.ts` |
| `features/access/lib/userRules.ts` | `08-pipeline-edicion-usuarios/03-userRules.ts` |
| `features/access/components/users/UserAvatar.tsx` | `08-pipeline-edicion-usuarios/04-UserAvatar.tsx` |
| `features/access/modals.ts` | `08-pipeline-edicion-usuarios/05-modals.ts` |

#### 09-pipeline-accesos-por-vista

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `09-pipeline-accesos-por-vista/01-useUserAccess.ts` | `09-pipeline-accesos-por-vista/00-director-accesos-por-vista.ts` |
| `features/access/hooks/useUserAccess.ts` | `09-pipeline-accesos-por-vista/01-useUserAccess.ts` |
| `features/access/config/views.config.ts` | `09-pipeline-accesos-por-vista/02-views.config.ts` |
| `features/access/components/users/access/AccessSidebar.tsx` | `09-pipeline-accesos-por-vista/03-AccessSidebar.tsx` |
| `features/access/components/users/access/AccessSummaryBar.tsx` | `09-pipeline-accesos-por-vista/04-AccessSummaryBar.tsx` |
| `features/access/components/users/access/ViewActionsPanel.tsx` | `09-pipeline-accesos-por-vista/05-ViewActionsPanel.tsx` |

#### 10-pipeline-cambio-contrasena

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `10-pipeline-cambio-contrasena/01-ChangePasswordScreen.tsx` | `10-pipeline-cambio-contrasena/00-director-cambio-contrasena.ts` |
| `features/access/components/password/ChangePasswordScreen.tsx` | `10-pipeline-cambio-contrasena/01-ChangePasswordScreen.tsx` |
| `features/access/hooks/usePasswordForms.ts` | `10-pipeline-cambio-contrasena/02-usePasswordForms.ts` |
| `features/access/components/password/NewPasswordFields.tsx` | `10-pipeline-cambio-contrasena/03-NewPasswordFields.tsx` |
| `features/access/lib/password.ts` | `10-pipeline-cambio-contrasena/04-password.ts` |

#### 11-pipeline-restablecimiento-contrasena

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `11-pipeline-restablecimiento-contrasena/01-ResetPasswordModal.tsx` | `11-pipeline-restablecimiento-contrasena/00-director-restablecimiento-contrasena.ts` |
| `features/access/components/users/ResetPasswordModal.tsx` | `11-pipeline-restablecimiento-contrasena/01-ResetPasswordModal.tsx` |
| `features/access/components/password/PasswordInput.tsx` | `11-pipeline-restablecimiento-contrasena/02-PasswordInput.tsx` |
| `features/access/components/password/PasswordStrength.tsx` | `11-pipeline-restablecimiento-contrasena/03-PasswordStrength.tsx` |


### Catálogo e inventario

#### 12-pipeline-listado-productos

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `12-pipeline-listado-productos/01-ProductsPage.tsx` | `12-pipeline-listado-productos/00-director-listado-productos.ts` |
| `features/catalog/pages/ProductsPage.tsx` | `12-pipeline-listado-productos/01-ProductsPage.tsx` |
| `features/catalog/hooks/useFilteredProducts.ts` | `12-pipeline-listado-productos/02-useFilteredProducts.ts` |
| `features/catalog/hooks/usePaginatedProducts.ts` | `12-pipeline-listado-productos/03-usePaginatedProducts.ts` |
| `features/catalog/components/ProductsEmptyState.tsx` | `12-pipeline-listado-productos/04-ProductsEmptyState.tsx` |

#### 13-pipeline-filtros-productos

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `13-pipeline-filtros-productos/01-useProductFilters.ts` | `13-pipeline-filtros-productos/00-director-filtros-productos.ts` |
| `features/catalog/hooks/useProductFilters.ts` | `13-pipeline-filtros-productos/01-useProductFilters.ts` |
| `features/catalog/filters.store.ts` | `13-pipeline-filtros-productos/02-filters.store.ts` |
| `features/catalog/components/toolbar/ProductToolbar.tsx` | `13-pipeline-filtros-productos/03-ProductToolbar.tsx` |
| `features/catalog/components/toolbar/ViewModeToggle.tsx` | `13-pipeline-filtros-productos/04-ViewModeToggle.tsx` |

#### 14-pipeline-tarjetas-productos

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `14-pipeline-tarjetas-productos/01-ProductGrid.tsx` | `14-pipeline-tarjetas-productos/00-director-tarjetas-productos.ts` |
| `features/catalog/components/grid/ProductGrid.tsx` | `14-pipeline-tarjetas-productos/01-ProductGrid.tsx` |
| `features/catalog/components/grid/ProductCard.tsx` | `14-pipeline-tarjetas-productos/02-ProductCard.tsx` |
| `features/catalog/components/grid/CardMedia.tsx` | `14-pipeline-tarjetas-productos/03-CardMedia.tsx` |
| `features/catalog/components/grid/CardBody.tsx` | `14-pipeline-tarjetas-productos/04-CardBody.tsx` |
| `features/catalog/components/grid/CardFooter.tsx` | `14-pipeline-tarjetas-productos/05-CardFooter.tsx` |

#### 15-pipeline-tabla-existencias

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `15-pipeline-tabla-existencias/01-ProductTable.tsx` | `15-pipeline-tabla-existencias/00-director-tabla-existencias.ts` |
| `features/catalog/components/table/ProductTable.tsx` | `15-pipeline-tabla-existencias/01-ProductTable.tsx` |
| `features/catalog/components/table/ProductTableRow.tsx` | `15-pipeline-tabla-existencias/02-ProductTableRow.tsx` |
| `features/catalog/components/StockBadge.tsx` | `15-pipeline-tabla-existencias/03-StockBadge.tsx` |
| `features/catalog/components/StockStepper.tsx` | `15-pipeline-tabla-existencias/04-StockStepper.tsx` |
| `features/catalog/components/ReservedBadge.tsx` | `15-pipeline-tabla-existencias/05-ReservedBadge.tsx` |

#### 16-pipeline-consulta-producto

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `16-pipeline-consulta-producto/01-ProductDetailModal.tsx` | `16-pipeline-consulta-producto/00-director-consulta-producto.ts` |
| `features/catalog/components/detail/ProductDetailModal.tsx` | `16-pipeline-consulta-producto/01-ProductDetailModal.tsx` |
| `features/catalog/hooks/useProductDetail.ts` | `16-pipeline-consulta-producto/02-useProductDetail.ts` |
| `features/catalog/components/detail/DetailSummary.tsx` | `16-pipeline-consulta-producto/03-DetailSummary.tsx` |
| `features/catalog/components/detail/DetailMetrics.tsx` | `16-pipeline-consulta-producto/04-DetailMetrics.tsx` |

#### 17-pipeline-ficha-producto

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `17-pipeline-ficha-producto/01-DetailGallery.tsx` | `17-pipeline-ficha-producto/00-director-ficha-producto.ts` |
| `features/catalog/components/detail/DetailGallery.tsx` | `17-pipeline-ficha-producto/01-DetailGallery.tsx` |
| `features/catalog/components/detail/DetailSpecs.tsx` | `17-pipeline-ficha-producto/02-DetailSpecs.tsx` |
| `features/catalog/lib/productImages.ts` | `17-pipeline-ficha-producto/03-productImages.ts` |

#### 18-pipeline-edicion-producto

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `18-pipeline-edicion-producto/01-ProductFormModal.tsx` | `18-pipeline-edicion-producto/00-director-edicion-producto.ts` |
| `features/catalog/components/form/ProductFormModal.tsx` | `18-pipeline-edicion-producto/01-ProductFormModal.tsx` |
| `features/catalog/hooks/useProductForm.ts` | `18-pipeline-edicion-producto/02-useProductForm.ts` |
| `features/catalog/hooks/form/useProductFormState.ts` | `18-pipeline-edicion-producto/03-useProductFormState.ts` |
| `features/catalog/components/form/ProductFormTabs.tsx` | `18-pipeline-edicion-producto/04-ProductFormTabs.tsx` |
| `features/catalog/components/form/ProductFormFooter.tsx` | `18-pipeline-edicion-producto/05-ProductFormFooter.tsx` |

#### 19-pipeline-datos-comerciales-producto

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `19-pipeline-datos-comerciales-producto/01-GeneralTab.tsx` | `19-pipeline-datos-comerciales-producto/00-director-datos-comerciales-producto.ts` |
| `features/catalog/components/form/tabs/GeneralTab.tsx` | `19-pipeline-datos-comerciales-producto/01-GeneralTab.tsx` |
| `features/catalog/components/form/tabs/PricingTab.tsx` | `19-pipeline-datos-comerciales-producto/02-PricingTab.tsx` |
| `features/catalog/components/form/tabs/CommercialSummary.tsx` | `19-pipeline-datos-comerciales-producto/03-CommercialSummary.tsx` |
| `features/catalog/components/form/tabs/LogisticsTab.tsx` | `19-pipeline-datos-comerciales-producto/04-LogisticsTab.tsx` |
| `features/catalog/components/form/tabs/LotRowsEditor.tsx` | `19-pipeline-datos-comerciales-producto/05-LotRowsEditor.tsx` |

#### 20-pipeline-validacion-producto

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `20-pipeline-validacion-producto/01-productForm.ts` | `20-pipeline-validacion-producto/00-director-validacion-producto.ts` |
| `features/catalog/lib/productForm.ts` | `20-pipeline-validacion-producto/01-productForm.ts` |
| `features/catalog/lib/productValidation.ts` | `20-pipeline-validacion-producto/02-productValidation.ts` |
| `features/catalog/lib/normalize.ts` | `20-pipeline-validacion-producto/03-normalize.ts` |
| `features/catalog/components/form/tabs/SpecsTab.tsx` | `20-pipeline-validacion-producto/04-SpecsTab.tsx` |
| `features/catalog/components/form/tabs/SpecRowsEditor.tsx` | `20-pipeline-validacion-producto/05-SpecRowsEditor.tsx` |

#### 21-pipeline-imagenes-producto

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `21-pipeline-imagenes-producto/01-ImageGallery.tsx` | `21-pipeline-imagenes-producto/00-director-imagenes-producto.ts` |
| `features/catalog/components/form/tabs/images/ImageGallery.tsx` | `21-pipeline-imagenes-producto/01-ImageGallery.tsx` |
| `features/catalog/components/form/tabs/images/ImageDropzone.tsx` | `21-pipeline-imagenes-producto/02-ImageDropzone.tsx` |
| `features/catalog/components/form/tabs/images/ImageThumb.tsx` | `21-pipeline-imagenes-producto/03-ImageThumb.tsx` |
| `features/catalog/hooks/form/useImageGallery.ts` | `21-pipeline-imagenes-producto/04-useImageGallery.ts` |

#### 22-pipeline-captura-imagen-producto

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `22-pipeline-captura-imagen-producto/01-ImageUrlInput.tsx` | `22-pipeline-captura-imagen-producto/00-director-captura-imagen-producto.ts` |
| `features/catalog/components/form/tabs/images/ImageUrlInput.tsx` | `22-pipeline-captura-imagen-producto/01-ImageUrlInput.tsx` |
| `features/catalog/hooks/form/useImageUrlEntry.ts` | `22-pipeline-captura-imagen-producto/02-useImageUrlEntry.ts` |
| `features/catalog/hooks/form/useImagePicker.ts` | `22-pipeline-captura-imagen-producto/03-useImagePicker.ts` |

#### 23-pipeline-seleccion-productos

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `23-pipeline-seleccion-productos/01-ProductPicker.tsx` | `23-pipeline-seleccion-productos/00-director-seleccion-productos.ts` |
| `features/catalog/components/picker/ProductPicker.tsx` | `23-pipeline-seleccion-productos/01-ProductPicker.tsx` |
| `features/catalog/hooks/useProductPicker.ts` | `23-pipeline-seleccion-productos/02-useProductPicker.ts` |
| `features/catalog/lib/pricePort.ts` | `23-pipeline-seleccion-productos/03-pricePort.ts` |
| `features/catalog/lib/commercial.ts` | `23-pipeline-seleccion-productos/04-commercial.ts` |

#### 24-pipeline-inventario-productos

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `24-pipeline-inventario-productos/01-useProductActions.ts` | `24-pipeline-inventario-productos/00-director-inventario-productos.ts` |
| `features/catalog/hooks/useProductActions.ts` | `24-pipeline-inventario-productos/01-useProductActions.ts` |
| `features/catalog/hooks/useInventoryMetrics.ts` | `24-pipeline-inventario-productos/02-useInventoryMetrics.ts` |
| `features/catalog/lib/inventory.ts` | `24-pipeline-inventario-productos/03-inventory.ts` |
| `features/catalog/lib/reservationPort.ts` | `24-pipeline-inventario-productos/04-reservationPort.ts` |
| `features/catalog/modals.ts` | `24-pipeline-inventario-productos/05-modals.ts` |

#### 25-pipeline-persistencia-catalogo

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `25-pipeline-persistencia-catalogo/01-store.ts` | `25-pipeline-persistencia-catalogo/00-director-persistencia-catalogo.ts` |
| `features/catalog/store.ts` | `25-pipeline-persistencia-catalogo/01-store.ts` |
| `features/catalog/lib/catalog.service.ts` | `25-pipeline-persistencia-catalogo/02-catalog.service.ts` |
| `features/catalog/lib/taxonomy.ts` | `25-pipeline-persistencia-catalogo/03-taxonomy.ts` |
| `features/catalog/types.ts` | `25-pipeline-persistencia-catalogo/04-types.ts` |

#### 26-pipeline-categorias-productos

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `26-pipeline-categorias-productos/01-CategoriesPage.tsx` | `26-pipeline-categorias-productos/00-director-categorias-productos.ts` |
| `features/catalog/pages/CategoriesPage.tsx` | `26-pipeline-categorias-productos/01-CategoriesPage.tsx` |
| `features/catalog/hooks/taxonomy/useTaxonomyPage.ts` | `26-pipeline-categorias-productos/02-useTaxonomyPage.ts` |
| `features/catalog/hooks/taxonomy/useCategoriesTab.ts` | `26-pipeline-categorias-productos/03-useCategoriesTab.ts` |
| `features/catalog/hooks/useShowCategoryProducts.ts` | `26-pipeline-categorias-productos/04-useShowCategoryProducts.ts` |
| `features/catalog/components/taxonomy/TaxonomyToolbar.tsx` | `26-pipeline-categorias-productos/05-TaxonomyToolbar.tsx` |

#### 27-pipeline-edicion-categorias

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `27-pipeline-edicion-categorias/01-CategoryFormModal.tsx` | `27-pipeline-edicion-categorias/00-director-edicion-categorias.ts` |
| `features/catalog/components/taxonomy/CategoryFormModal.tsx` | `27-pipeline-edicion-categorias/01-CategoryFormModal.tsx` |
| `features/catalog/hooks/useCategoryForm.ts` | `27-pipeline-edicion-categorias/02-useCategoryForm.ts` |
| `features/catalog/components/taxonomy/CategoryCard.tsx` | `27-pipeline-edicion-categorias/03-CategoryCard.tsx` |

#### 28-pipeline-marcas-productos

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `28-pipeline-marcas-productos/01-BrandFormModal.tsx` | `28-pipeline-marcas-productos/00-director-marcas-productos.ts` |
| `features/catalog/components/taxonomy/BrandFormModal.tsx` | `28-pipeline-marcas-productos/01-BrandFormModal.tsx` |
| `features/catalog/hooks/useBrandForm.ts` | `28-pipeline-marcas-productos/02-useBrandForm.ts` |
| `features/catalog/hooks/taxonomy/useBrandsTab.ts` | `28-pipeline-marcas-productos/03-useBrandsTab.ts` |
| `features/catalog/components/taxonomy/BrandRow.tsx` | `28-pipeline-marcas-productos/04-BrandRow.tsx` |
| `features/catalog/components/taxonomy/BrandsTable.tsx` | `28-pipeline-marcas-productos/05-BrandsTable.tsx` |


### Clientes

#### 29-pipeline-directorio-clientes

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `29-pipeline-directorio-clientes/01-CustomersPage.tsx` | `29-pipeline-directorio-clientes/00-director-directorio-clientes.ts` |
| `features/customers/pages/CustomersPage.tsx` | `29-pipeline-directorio-clientes/01-CustomersPage.tsx` |
| `features/customers/hooks/useCustomers.ts` | `29-pipeline-directorio-clientes/02-useCustomers.ts` |
| `features/customers/components/CustomersToolbar.tsx` | `29-pipeline-directorio-clientes/03-CustomersToolbar.tsx` |
| `features/customers/components/CustomerRow.tsx` | `29-pipeline-directorio-clientes/04-CustomerRow.tsx` |

#### 30-pipeline-registro-clientes

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `30-pipeline-registro-clientes/01-CustomerFormModal.tsx` | `30-pipeline-registro-clientes/00-director-registro-clientes.ts` |
| `features/customers/components/CustomerFormModal.tsx` | `30-pipeline-registro-clientes/01-CustomerFormModal.tsx` |
| `features/customers/hooks/useCustomerForm.ts` | `30-pipeline-registro-clientes/02-useCustomerForm.ts` |
| `features/customers/lib/customer.service.ts` | `30-pipeline-registro-clientes/03-customer.service.ts` |
| `features/customers/modals.ts` | `30-pipeline-registro-clientes/04-modals.ts` |

#### 31-pipeline-seleccion-clientes

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `31-pipeline-seleccion-clientes/01-CustomerPicker.tsx` | `31-pipeline-seleccion-clientes/00-director-seleccion-clientes.ts` |
| `features/customers/components/CustomerPicker.tsx` | `31-pipeline-seleccion-clientes/01-CustomerPicker.tsx` |
| `features/customers/hooks/useCustomerSelection.ts` | `31-pipeline-seleccion-clientes/02-useCustomerSelection.ts` |
| `features/customers/hooks/useCustomerCombobox.ts` | `31-pipeline-seleccion-clientes/03-useCustomerCombobox.ts` |
| `features/customers/components/picker/CustomerSearch.tsx` | `31-pipeline-seleccion-clientes/04-CustomerSearch.tsx` |
| `features/customers/components/picker/WalkinCustomerFields.tsx` | `31-pipeline-seleccion-clientes/05-WalkinCustomerFields.tsx` |

#### 32-pipeline-identificacion-clientes

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `32-pipeline-identificacion-clientes/01-CustomerOption.tsx` | `32-pipeline-identificacion-clientes/00-director-identificacion-clientes.ts` |
| `features/customers/components/picker/CustomerOption.tsx` | `32-pipeline-identificacion-clientes/01-CustomerOption.tsx` |
| `features/customers/components/picker/CustomerInitials.tsx` | `32-pipeline-identificacion-clientes/02-CustomerInitials.tsx` |
| `features/customers/components/picker/SelectedCustomerCard.tsx` | `32-pipeline-identificacion-clientes/03-SelectedCustomerCard.tsx` |
| `features/customers/components/picker/DuplicateCustomerNotice.tsx` | `32-pipeline-identificacion-clientes/04-DuplicateCustomerNotice.tsx` |

#### 33-pipeline-historial-clientes

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `33-pipeline-historial-clientes/01-store.ts` | `33-pipeline-historial-clientes/00-director-historial-clientes.ts` |
| `features/customers/store.ts` | `33-pipeline-historial-clientes/01-store.ts` |
| `features/customers/lib/statsPort.ts` | `33-pipeline-historial-clientes/02-statsPort.ts` |
| `features/customers/types.ts` | `33-pipeline-historial-clientes/03-types.ts` |


### Ventas y pedidos

#### 34-pipeline-listado-pedidos

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `34-pipeline-listado-pedidos/01-OrdersPage.tsx` | `34-pipeline-listado-pedidos/00-director-listado-pedidos.ts` |
| `features/sales/pages/OrdersPage.tsx` | `34-pipeline-listado-pedidos/01-OrdersPage.tsx` |
| `features/sales/hooks/usePaginatedOrders.ts` | `34-pipeline-listado-pedidos/02-usePaginatedOrders.ts` |
| `features/sales/components/orders/OrdersTable.tsx` | `34-pipeline-listado-pedidos/03-OrdersTable.tsx` |
| `features/sales/components/orders/OrderRow.tsx` | `34-pipeline-listado-pedidos/04-OrderRow.tsx` |
| `features/sales/components/orders/OrdersToolbar.tsx` | `34-pipeline-listado-pedidos/05-OrdersToolbar.tsx` |

#### 35-pipeline-consulta-pedidos

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `35-pipeline-consulta-pedidos/01-useOrders.ts` | `35-pipeline-consulta-pedidos/00-director-consulta-pedidos.ts` |
| `features/sales/hooks/useOrders.ts` | `35-pipeline-consulta-pedidos/01-useOrders.ts` |
| `features/sales/filters.store.ts` | `35-pipeline-consulta-pedidos/02-filters.store.ts` |
| `features/sales/lib/orderSort.ts` | `35-pipeline-consulta-pedidos/03-orderSort.ts` |
| `features/sales/components/OrderStatusTabs.tsx` | `35-pipeline-consulta-pedidos/04-OrderStatusTabs.tsx` |
| `features/sales/components/orders/RecentOrdersTable.tsx` | `35-pipeline-consulta-pedidos/05-RecentOrdersTable.tsx` |

#### 36-pipeline-preparacion-pedidos

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `36-pipeline-preparacion-pedidos/01-NewOrderPage.tsx` | `36-pipeline-preparacion-pedidos/00-director-preparacion-pedidos.ts` |
| `features/sales/pages/NewOrderPage.tsx` | `36-pipeline-preparacion-pedidos/01-NewOrderPage.tsx` |
| `features/sales/pages/EditOrderPage.tsx` | `36-pipeline-preparacion-pedidos/02-EditOrderPage.tsx` |
| `features/sales/hooks/useOrderBuilder.ts` | `36-pipeline-preparacion-pedidos/03-useOrderBuilder.ts` |
| `features/sales/components/builder/OrderDeliverySection.tsx` | `36-pipeline-preparacion-pedidos/04-OrderDeliverySection.tsx` |
| `features/sales/components/builder/OrderSummaryPanel.tsx` | `36-pipeline-preparacion-pedidos/05-OrderSummaryPanel.tsx` |

#### 37-pipeline-detalle-pedidos

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `37-pipeline-detalle-pedidos/01-OrderDetailModal.tsx` | `37-pipeline-detalle-pedidos/00-director-detalle-pedidos.ts` |
| `features/sales/components/detail/OrderDetailModal.tsx` | `37-pipeline-detalle-pedidos/01-OrderDetailModal.tsx` |
| `features/sales/hooks/useOrderDetail.ts` | `37-pipeline-detalle-pedidos/02-useOrderDetail.ts` |
| `features/sales/components/detail/OrderLines.tsx` | `37-pipeline-detalle-pedidos/03-OrderLines.tsx` |
| `features/sales/components/detail/OrderTimeline.tsx` | `37-pipeline-detalle-pedidos/04-OrderTimeline.tsx` |
| `features/sales/components/OrderActionButtons.tsx` | `37-pipeline-detalle-pedidos/05-OrderActionButtons.tsx` |

#### 38-pipeline-reserva-pedidos

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `38-pipeline-reserva-pedidos/01-ReserveOrderModal.tsx` | `38-pipeline-reserva-pedidos/00-director-reserva-pedidos.ts` |
| `features/sales/components/reserve/ReserveOrderModal.tsx` | `38-pipeline-reserva-pedidos/01-ReserveOrderModal.tsx` |
| `features/sales/hooks/useReserveOrder.ts` | `38-pipeline-reserva-pedidos/02-useReserveOrder.ts` |
| `features/sales/hooks/useReservationExpiry.ts` | `38-pipeline-reserva-pedidos/03-useReservationExpiry.ts` |
| `features/sales/lib/reservation.ts` | `38-pipeline-reserva-pedidos/04-reservation.ts` |
| `features/sales/components/ReservationTag.tsx` | `38-pipeline-reserva-pedidos/05-ReservationTag.tsx` |

#### 39-pipeline-transiciones-pedidos

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `39-pipeline-transiciones-pedidos/01-useOrderActions.ts` | `39-pipeline-transiciones-pedidos/00-director-transiciones-pedidos.ts` |
| `features/sales/hooks/useOrderActions.ts` | `39-pipeline-transiciones-pedidos/01-useOrderActions.ts` |
| `features/sales/lib/orderFlow.ts` | `39-pipeline-transiciones-pedidos/02-orderFlow.ts` |
| `features/sales/lib/stock.ts` | `39-pipeline-transiciones-pedidos/03-stock.ts` |
| `features/sales/components/OrderStatusBadge.tsx` | `39-pipeline-transiciones-pedidos/04-OrderStatusBadge.tsx` |
| `features/sales/modals.ts` | `39-pipeline-transiciones-pedidos/05-modals.ts` |

#### 40-pipeline-canales-venta

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `40-pipeline-canales-venta/01-ChannelsTable.tsx` | `40-pipeline-canales-venta/00-director-canales-venta.ts` |
| `features/sales/components/channels/ChannelsTable.tsx` | `40-pipeline-canales-venta/01-ChannelsTable.tsx` |
| `features/sales/components/channels/ChannelFormModal.tsx` | `40-pipeline-canales-venta/02-ChannelFormModal.tsx` |
| `features/sales/hooks/useChannels.ts` | `40-pipeline-canales-venta/03-useChannels.ts` |
| `features/sales/hooks/useChannelForm.ts` | `40-pipeline-canales-venta/04-useChannelForm.ts` |

#### 41-pipeline-etapas-venta

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `41-pipeline-etapas-venta/01-FlowTable.tsx` | `41-pipeline-etapas-venta/00-director-etapas-venta.ts` |
| `features/sales/components/flow/FlowTable.tsx` | `41-pipeline-etapas-venta/01-FlowTable.tsx` |
| `features/sales/components/flow/StatusLabelModal.tsx` | `41-pipeline-etapas-venta/02-StatusLabelModal.tsx` |
| `features/sales/hooks/useFlowTable.ts` | `41-pipeline-etapas-venta/03-useFlowTable.ts` |

#### 42-pipeline-persistencia-pedidos

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `42-pipeline-persistencia-pedidos/01-store.ts` | `42-pipeline-persistencia-pedidos/00-director-persistencia-pedidos.ts` |
| `features/sales/store.ts` | `42-pipeline-persistencia-pedidos/01-store.ts` |
| `features/sales/lib/order.service.ts` | `42-pipeline-persistencia-pedidos/02-order.service.ts` |
| `features/sales/lib/migrate.ts` | `42-pipeline-persistencia-pedidos/03-migrate.ts` |
| `features/sales/lib/orderSeed.ts` | `42-pipeline-persistencia-pedidos/04-orderSeed.ts` |
| `features/sales/types.ts` | `42-pipeline-persistencia-pedidos/05-types.ts` |

#### 43-pipeline-reglas-pedidos

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `43-pipeline-reglas-pedidos/01-prefill.store.ts` | `43-pipeline-reglas-pedidos/00-director-reglas-pedidos.ts` |
| `features/sales/prefill.store.ts` | `43-pipeline-reglas-pedidos/01-prefill.store.ts` |
| `features/sales/lib/orderValidation.ts` | `43-pipeline-reglas-pedidos/02-orderValidation.ts` |
| `features/sales/lib/customerStats.ts` | `43-pipeline-reglas-pedidos/03-customerStats.ts` |
| `features/sales/lib/charges.ts` | `43-pipeline-reglas-pedidos/04-charges.ts` |


### Facturación

#### 44-pipeline-listado-facturacion

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `44-pipeline-listado-facturacion/01-BillingPage.tsx` | `44-pipeline-listado-facturacion/00-director-listado-facturacion.ts` |
| `features/billing/pages/BillingPage.tsx` | `44-pipeline-listado-facturacion/01-BillingPage.tsx` |
| `features/billing/hooks/useBilling.ts` | `44-pipeline-listado-facturacion/02-useBilling.ts` |
| `features/billing/components/list/BillingToolbar.tsx` | `44-pipeline-listado-facturacion/03-BillingToolbar.tsx` |
| `features/billing/components/list/InvoicesTable.tsx` | `44-pipeline-listado-facturacion/04-InvoicesTable.tsx` |
| `features/billing/components/list/PendingOrdersTable.tsx` | `44-pipeline-listado-facturacion/05-PendingOrdersTable.tsx` |

#### 45-pipeline-emision-facturas

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `45-pipeline-emision-facturas/01-InvoiceEmitModal.tsx` | `45-pipeline-emision-facturas/00-director-emision-facturas.ts` |
| `features/billing/components/emit/InvoiceEmitModal.tsx` | `45-pipeline-emision-facturas/01-InvoiceEmitModal.tsx` |
| `features/billing/hooks/useInvoiceEmit.ts` | `45-pipeline-emision-facturas/02-useInvoiceEmit.ts` |
| `features/billing/components/emit/ReceptorFields.tsx` | `45-pipeline-emision-facturas/03-ReceptorFields.tsx` |
| `features/billing/components/emit/StockCheck.tsx` | `45-pipeline-emision-facturas/04-StockCheck.tsx` |
| `features/billing/modals.ts` | `45-pipeline-emision-facturas/05-modals.ts` |

#### 46-pipeline-documento-factura

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `46-pipeline-documento-factura/01-InvoicePreviewModal.tsx` | `46-pipeline-documento-factura/00-director-documento-factura.ts` |
| `features/billing/components/preview/InvoicePreviewModal.tsx` | `46-pipeline-documento-factura/01-InvoicePreviewModal.tsx` |
| `features/billing/hooks/useInvoicePreview.ts` | `46-pipeline-documento-factura/02-useInvoicePreview.ts` |
| `features/billing/lib/invoicePdf.ts` | `46-pipeline-documento-factura/03-invoicePdf.ts` |
| `features/billing/components/InvoiceStatusBadge.tsx` | `46-pipeline-documento-factura/04-InvoiceStatusBadge.tsx` |

#### 47-pipeline-persistencia-facturas

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `47-pipeline-persistencia-facturas/01-store.ts` | `47-pipeline-persistencia-facturas/00-director-persistencia-facturas.ts` |
| `features/billing/store.ts` | `47-pipeline-persistencia-facturas/01-store.ts` |
| `features/billing/lib/invoice.service.ts` | `47-pipeline-persistencia-facturas/02-invoice.service.ts` |
| `features/billing/types.ts` | `47-pipeline-persistencia-facturas/03-types.ts` |


### Cotizaciones

#### 48-pipeline-listado-cotizaciones

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `48-pipeline-listado-cotizaciones/01-QuotesPage.tsx` | `48-pipeline-listado-cotizaciones/00-director-listado-cotizaciones.ts` |
| `features/quotes/pages/QuotesPage.tsx` | `48-pipeline-listado-cotizaciones/01-QuotesPage.tsx` |
| `features/quotes/hooks/useQuotes.ts` | `48-pipeline-listado-cotizaciones/02-useQuotes.ts` |
| `features/quotes/components/list/QuoteRow.tsx` | `48-pipeline-listado-cotizaciones/03-QuoteRow.tsx` |
| `features/quotes/components/list/QuotesToolbar.tsx` | `48-pipeline-listado-cotizaciones/04-QuotesToolbar.tsx` |
| `features/quotes/components/QuoteStatusBadge.tsx` | `48-pipeline-listado-cotizaciones/05-QuoteStatusBadge.tsx` |

#### 49-pipeline-preparacion-cotizaciones

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `49-pipeline-preparacion-cotizaciones/01-NewQuotePage.tsx` | `49-pipeline-preparacion-cotizaciones/00-director-preparacion-cotizaciones.ts` |
| `features/quotes/pages/NewQuotePage.tsx` | `49-pipeline-preparacion-cotizaciones/01-NewQuotePage.tsx` |
| `features/quotes/hooks/useQuoteBuilder.ts` | `49-pipeline-preparacion-cotizaciones/02-useQuoteBuilder.ts` |
| `features/quotes/components/builder/QuoteSummaryPanel.tsx` | `49-pipeline-preparacion-cotizaciones/03-QuoteSummaryPanel.tsx` |

#### 50-pipeline-documento-cotizacion

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `50-pipeline-documento-cotizacion/01-QuotePreviewModal.tsx` | `50-pipeline-documento-cotizacion/00-director-documento-cotizacion.ts` |
| `features/quotes/components/preview/QuotePreviewModal.tsx` | `50-pipeline-documento-cotizacion/01-QuotePreviewModal.tsx` |
| `features/quotes/hooks/useQuotePreview.ts` | `50-pipeline-documento-cotizacion/02-useQuotePreview.ts` |
| `features/quotes/lib/quotePdf.ts` | `50-pipeline-documento-cotizacion/03-quotePdf.ts` |
| `features/quotes/modals.ts` | `50-pipeline-documento-cotizacion/04-modals.ts` |

#### 51-pipeline-persistencia-cotizaciones

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `51-pipeline-persistencia-cotizaciones/01-store.ts` | `51-pipeline-persistencia-cotizaciones/00-director-persistencia-cotizaciones.ts` |
| `features/quotes/store.ts` | `51-pipeline-persistencia-cotizaciones/01-store.ts` |
| `features/quotes/lib/quote.service.ts` | `51-pipeline-persistencia-cotizaciones/02-quote.service.ts` |
| `features/quotes/types.ts` | `51-pipeline-persistencia-cotizaciones/03-types.ts` |


### Ofertas

#### 52-pipeline-listado-ofertas

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `52-pipeline-listado-ofertas/01-PromotionsPage.tsx` | `52-pipeline-listado-ofertas/00-director-listado-ofertas.ts` |
| `features/promotions/pages/PromotionsPage.tsx` | `52-pipeline-listado-ofertas/01-PromotionsPage.tsx` |
| `features/promotions/hooks/useOffers.ts` | `52-pipeline-listado-ofertas/02-useOffers.ts` |
| `features/promotions/components/list/OfferRow.tsx` | `52-pipeline-listado-ofertas/03-OfferRow.tsx` |
| `features/promotions/components/list/OffersToolbar.tsx` | `52-pipeline-listado-ofertas/04-OffersToolbar.tsx` |

#### 53-pipeline-preparacion-ofertas

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `53-pipeline-preparacion-ofertas/01-OfferBuilderPage.tsx` | `53-pipeline-preparacion-ofertas/00-director-preparacion-ofertas.ts` |
| `features/promotions/pages/OfferBuilderPage.tsx` | `53-pipeline-preparacion-ofertas/01-OfferBuilderPage.tsx` |
| `features/promotions/hooks/useOfferBuilder.ts` | `53-pipeline-preparacion-ofertas/02-useOfferBuilder.ts` |
| `features/promotions/components/builder/OfferPanel.tsx` | `53-pipeline-preparacion-ofertas/03-OfferPanel.tsx` |
| `features/promotions/components/builder/OfferProductList.tsx` | `53-pipeline-preparacion-ofertas/04-OfferProductList.tsx` |

#### 54-pipeline-precio-ofertas

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `54-pipeline-precio-ofertas/01-useOfferPriceResolver.ts` | `54-pipeline-precio-ofertas/00-director-precio-ofertas.ts` |
| `features/promotions/hooks/useOfferPriceResolver.ts` | `54-pipeline-precio-ofertas/01-useOfferPriceResolver.ts` |
| `features/promotions/lib/offerPricing.ts` | `54-pipeline-precio-ofertas/02-offerPricing.ts` |
| `features/promotions/store.ts` | `54-pipeline-precio-ofertas/03-store.ts` |
| `features/promotions/types.ts` | `54-pipeline-precio-ofertas/04-types.ts` |


### Comentarios

#### 55-pipeline-moderacion-comentarios

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `55-pipeline-moderacion-comentarios/01-InteractionsPage.tsx` | `55-pipeline-moderacion-comentarios/00-director-moderacion-comentarios.ts` |
| `features/interactions/pages/InteractionsPage.tsx` | `55-pipeline-moderacion-comentarios/01-InteractionsPage.tsx` |
| `features/interactions/hooks/useReviewModeration.ts` | `55-pipeline-moderacion-comentarios/02-useReviewModeration.ts` |
| `features/interactions/components/ReviewCard.tsx` | `55-pipeline-moderacion-comentarios/03-ReviewCard.tsx` |
| `features/interactions/components/ReviewsToolbar.tsx` | `55-pipeline-moderacion-comentarios/04-ReviewsToolbar.tsx` |
| `features/interactions/components/Stars.tsx` | `55-pipeline-moderacion-comentarios/05-Stars.tsx` |

#### 56-pipeline-persistencia-comentarios

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `56-pipeline-persistencia-comentarios/01-store.ts` | `56-pipeline-persistencia-comentarios/00-director-persistencia-comentarios.ts` |
| `features/interactions/store.ts` | `56-pipeline-persistencia-comentarios/01-store.ts` |
| `features/interactions/lib/reviews.service.ts` | `56-pipeline-persistencia-comentarios/02-reviews.service.ts` |
| `features/interactions/types.ts` | `56-pipeline-persistencia-comentarios/03-types.ts` |


### Tablero

#### 57-pipeline-resumen-administrativo

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `57-pipeline-resumen-administrativo/01-DashboardPage.tsx` | `57-pipeline-resumen-administrativo/00-director-resumen-administrativo.ts` |
| `features/dashboard/pages/DashboardPage.tsx` | `57-pipeline-resumen-administrativo/01-DashboardPage.tsx` |
| `features/dashboard/hooks/useDashboardMetrics.ts` | `57-pipeline-resumen-administrativo/02-useDashboardMetrics.ts` |
| `features/dashboard/components/KpiGrid.tsx` | `57-pipeline-resumen-administrativo/03-KpiGrid.tsx` |
| `features/dashboard/components/BranchBanner.tsx` | `57-pipeline-resumen-administrativo/04-BranchBanner.tsx` |

#### 58-pipeline-seguimiento-comercial

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `58-pipeline-seguimiento-comercial/01-QuickLinks.tsx` | `58-pipeline-seguimiento-comercial/00-director-seguimiento-comercial.ts` |
| `features/dashboard/components/QuickLinks.tsx` | `58-pipeline-seguimiento-comercial/01-QuickLinks.tsx` |
| `features/dashboard/config/quickLinks.config.ts` | `58-pipeline-seguimiento-comercial/02-quickLinks.config.ts` |
| `features/dashboard/components/RecentOrdersPanel.tsx` | `58-pipeline-seguimiento-comercial/03-RecentOrdersPanel.tsx` |
| `features/dashboard/components/StockHealthPanel.tsx` | `58-pipeline-seguimiento-comercial/04-StockHealthPanel.tsx` |


### Ajustes

#### 59-pipeline-centro-ajustes

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `59-pipeline-centro-ajustes/01-SettingsPage.tsx` | `59-pipeline-centro-ajustes/00-director-centro-ajustes.ts` |
| `features/settings/pages/SettingsPage.tsx` | `59-pipeline-centro-ajustes/01-SettingsPage.tsx` |
| `features/settings/hooks/useSettingsHub.ts` | `59-pipeline-centro-ajustes/02-useSettingsHub.ts` |
| `features/settings/config/hub.config.ts` | `59-pipeline-centro-ajustes/03-hub.config.ts` |
| `features/settings/config/hub.future.ts` | `59-pipeline-centro-ajustes/04-hub.future.ts` |
| `features/settings/components/SettingsHubCard.tsx` | `59-pipeline-centro-ajustes/05-SettingsHubCard.tsx` |

#### 60-pipeline-administracion-negocio

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `60-pipeline-administracion-negocio/01-UsersPage.tsx` | `60-pipeline-administracion-negocio/00-director-administracion-negocio.ts` |
| `features/settings/pages/UsersPage.tsx` | `60-pipeline-administracion-negocio/01-UsersPage.tsx` |
| `features/settings/pages/UserAccessPage.tsx` | `60-pipeline-administracion-negocio/02-UserAccessPage.tsx` |
| `features/settings/pages/ChannelsPage.tsx` | `60-pipeline-administracion-negocio/03-ChannelsPage.tsx` |
| `features/settings/hooks/useSettingsPageMeta.ts` | `60-pipeline-administracion-negocio/04-useSettingsPageMeta.ts` |

#### 61-pipeline-identidad-comercial

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `61-pipeline-identidad-comercial/01-IdentityPage.tsx` | `61-pipeline-identidad-comercial/00-director-identidad-comercial.ts` |
| `features/settings/pages/IdentityPage.tsx` | `61-pipeline-identidad-comercial/01-IdentityPage.tsx` |
| `features/settings/components/IdentityForm.tsx` | `61-pipeline-identidad-comercial/02-IdentityForm.tsx` |
| `features/settings/components/IdentityFields.tsx` | `61-pipeline-identidad-comercial/03-IdentityFields.tsx` |
| `features/settings/components/IdentityPreview.tsx` | `61-pipeline-identidad-comercial/04-IdentityPreview.tsx` |
| `features/settings/hooks/useIdentityForm.ts` | `61-pipeline-identidad-comercial/05-useIdentityForm.ts` |

#### 62-pipeline-parametros-emisor

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `62-pipeline-parametros-emisor/01-useStoreSettings.ts` | `62-pipeline-parametros-emisor/00-director-parametros-emisor.ts` |
| `features/settings/hooks/useStoreSettings.ts` | `62-pipeline-parametros-emisor/01-useStoreSettings.ts` |
| `features/settings/store.ts` | `62-pipeline-parametros-emisor/02-store.ts` |
| `features/settings/lib/identity.ts` | `62-pipeline-parametros-emisor/03-identity.ts` |
| `features/settings/lib/invoiceNumberPort.ts` | `62-pipeline-parametros-emisor/04-invoiceNumberPort.ts` |

#### 63-pipeline-mantenimiento-datos

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `63-pipeline-mantenimiento-datos/02-useMaintenance.ts` | `63-pipeline-mantenimiento-datos/00-director-mantenimiento-datos.ts` |
| `features/settings/pages/MaintenancePage.tsx` | `63-pipeline-mantenimiento-datos/01-MaintenancePage.tsx` |
| `features/settings/hooks/useMaintenance.ts` | `63-pipeline-mantenimiento-datos/02-useMaintenance.ts` |
| `features/settings/lib/backup.ts` | `63-pipeline-mantenimiento-datos/03-backup.ts` |
| `features/settings/components/BackupCard.tsx` | `63-pipeline-mantenimiento-datos/04-BackupCard.tsx` |
| `features/settings/components/ResetCard.tsx` | `63-pipeline-mantenimiento-datos/05-ResetCard.tsx` |

#### 64-pipeline-parametros-fiscales

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `64-pipeline-parametros-fiscales/02-FiscalCards.tsx` | `64-pipeline-parametros-fiscales/00-director-parametros-fiscales.ts` |
| `features/settings/pages/FiscalPage.tsx` | `64-pipeline-parametros-fiscales/01-FiscalPage.tsx` |
| `features/settings/components/FiscalCards.tsx` | `64-pipeline-parametros-fiscales/02-FiscalCards.tsx` |
| `features/settings/components/TaxpayerCard.tsx` | `64-pipeline-parametros-fiscales/03-TaxpayerCard.tsx` |


### Contratos compartidos existentes

#### 65-pipeline-campos-administrativos

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `65-pipeline-campos-administrativos/01-Input.tsx` | `65-pipeline-campos-administrativos/00-director-campos-administrativos.ts` |
| `shared/ui/Input.tsx` | `65-pipeline-campos-administrativos/01-Input.tsx` |
| `shared/ui/Textarea.tsx` | `65-pipeline-campos-administrativos/02-Textarea.tsx` |
| `shared/ui/Select.tsx` | `65-pipeline-campos-administrativos/03-Select.tsx` |
| `shared/ui/Field.tsx` | `65-pipeline-campos-administrativos/04-Field.tsx` |
| `shared/ui/controlStyles.ts` | `65-pipeline-campos-administrativos/05-controlStyles.ts` |

#### 66-pipeline-acciones-administrativas

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `66-pipeline-acciones-administrativas/01-Button.tsx` | `66-pipeline-acciones-administrativas/00-director-acciones-administrativas.ts` |
| `shared/ui/Button.tsx` | `66-pipeline-acciones-administrativas/01-Button.tsx` |
| `shared/ui/IconButton.tsx` | `66-pipeline-acciones-administrativas/02-IconButton.tsx` |
| `shared/ui/FormActions.tsx` | `66-pipeline-acciones-administrativas/03-FormActions.tsx` |
| `shared/ui/Checkbox.tsx` | `66-pipeline-acciones-administrativas/04-Checkbox.tsx` |

#### 67-pipeline-indicadores-administrativos

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `67-pipeline-indicadores-administrativos/01-Badge.tsx` | `67-pipeline-indicadores-administrativos/00-director-indicadores-administrativos.ts` |
| `shared/ui/Badge.tsx` | `67-pipeline-indicadores-administrativos/01-Badge.tsx` |
| `shared/ui/Avatar.tsx` | `67-pipeline-indicadores-administrativos/02-Avatar.tsx` |
| `shared/ui/KpiCard.tsx` | `67-pipeline-indicadores-administrativos/03-KpiCard.tsx` |
| `shared/ui/ProgressBar.tsx` | `67-pipeline-indicadores-administrativos/04-ProgressBar.tsx` |

#### 68-pipeline-marcos-contenido

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `68-pipeline-marcos-contenido/01-PageContainer.tsx` | `68-pipeline-marcos-contenido/00-director-marcos-contenido.ts` |
| `shared/ui/PageContainer.tsx` | `68-pipeline-marcos-contenido/01-PageContainer.tsx` |
| `shared/ui/Card.tsx` | `68-pipeline-marcos-contenido/02-Card.tsx` |
| `shared/ui/EmptyState.tsx` | `68-pipeline-marcos-contenido/03-EmptyState.tsx` |
| `shared/ui/AffixInput.tsx` | `68-pipeline-marcos-contenido/04-AffixInput.tsx` |

#### 69-pipeline-navegacion-listados

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `69-pipeline-navegacion-listados/01-ListToolbar.tsx` | `69-pipeline-navegacion-listados/00-director-navegacion-listados.ts` |
| `shared/ui/ListToolbar.tsx` | `69-pipeline-navegacion-listados/01-ListToolbar.tsx` |
| `shared/ui/LiveSearch.tsx` | `69-pipeline-navegacion-listados/02-LiveSearch.tsx` |
| `shared/ui/SegmentedTabs.tsx` | `69-pipeline-navegacion-listados/03-SegmentedTabs.tsx` |
| `shared/ui/BackLink.tsx` | `69-pipeline-navegacion-listados/04-BackLink.tsx` |
| `shared/ui/Breadcrumb.tsx` | `69-pipeline-navegacion-listados/05-Breadcrumb.tsx` |

#### 70-pipeline-orden-paginacion

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `70-pipeline-orden-paginacion/01-DataTable.tsx` | `70-pipeline-orden-paginacion/00-director-orden-paginacion.ts` |
| `shared/ui/DataTable.tsx` | `70-pipeline-orden-paginacion/01-DataTable.tsx` |
| `shared/ui/SortHeaderButton.tsx` | `70-pipeline-orden-paginacion/02-SortHeaderButton.tsx` |
| `shared/ui/Pagination.tsx` | `70-pipeline-orden-paginacion/03-Pagination.tsx` |
| `shared/hooks/usePagination.ts` | `70-pipeline-orden-paginacion/04-usePagination.ts` |
| `shared/lib/pagination.ts` | `70-pipeline-orden-paginacion/05-pagination.ts` |

#### 71-pipeline-seleccion-fechas

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `71-pipeline-seleccion-fechas/01-DatePicker.tsx` | `71-pipeline-seleccion-fechas/00-director-seleccion-fechas.ts` |
| `shared/ui/DatePicker.tsx` | `71-pipeline-seleccion-fechas/01-DatePicker.tsx` |
| `shared/ui/Calendar.tsx` | `71-pipeline-seleccion-fechas/02-Calendar.tsx` |
| `shared/hooks/useCalendar.ts` | `71-pipeline-seleccion-fechas/03-useCalendar.ts` |
| `shared/hooks/useAnchoredPopover.ts` | `71-pipeline-seleccion-fechas/04-useAnchoredPopover.ts` |
| `shared/lib/date.ts` | `71-pipeline-seleccion-fechas/05-date.ts` |

#### 72-pipeline-confirmaciones-globales

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `72-pipeline-confirmaciones-globales/01-ConfirmDialog.tsx` | `72-pipeline-confirmaciones-globales/00-director-confirmaciones-globales.ts` |
| `shared/ui/ConfirmDialog.tsx` | `72-pipeline-confirmaciones-globales/01-ConfirmDialog.tsx` |
| `shared/hooks/useConfirmDialog.ts` | `72-pipeline-confirmaciones-globales/02-useConfirmDialog.ts` |
| `shared/store/confirm.store.ts` | `72-pipeline-confirmaciones-globales/03-confirm.store.ts` |

#### 73-pipeline-modales-globales

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `73-pipeline-modales-globales/01-Modal.tsx` | `73-pipeline-modales-globales/00-director-modales-globales.ts` |
| `shared/ui/Modal.tsx` | `73-pipeline-modales-globales/01-Modal.tsx` |
| `shared/hooks/useEscapeKey.ts` | `73-pipeline-modales-globales/02-useEscapeKey.ts` |
| `shared/store/modal.store.ts` | `73-pipeline-modales-globales/03-modal.store.ts` |

#### 74-pipeline-tema-administrativo

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `74-pipeline-tema-administrativo/01-useTheme.ts` | `74-pipeline-tema-administrativo/00-director-tema-administrativo.ts` |
| `shared/hooks/useTheme.ts` | `74-pipeline-tema-administrativo/01-useTheme.ts` |
| `shared/store/theme.store.ts` | `74-pipeline-tema-administrativo/02-theme.store.ts` |
| `shared/ui/Switch.tsx` | `74-pipeline-tema-administrativo/03-Switch.tsx` |
| `shared/ui/SwitchField.tsx` | `74-pipeline-tema-administrativo/04-SwitchField.tsx` |

#### 75-pipeline-estado-navegacion

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `75-pipeline-estado-navegacion/01-usePageMeta.ts` | `75-pipeline-estado-navegacion/00-director-estado-navegacion.ts` |
| `shared/hooks/usePageMeta.ts` | `75-pipeline-estado-navegacion/01-usePageMeta.ts` |
| `shared/store/pageMeta.store.ts` | `75-pipeline-estado-navegacion/02-pageMeta.store.ts` |
| `shared/store/layout.store.ts` | `75-pipeline-estado-navegacion/03-layout.store.ts` |

#### 76-pipeline-avisos-globales

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `76-pipeline-avisos-globales/01-Toaster.tsx` | `76-pipeline-avisos-globales/00-director-avisos-globales.ts` |
| `shared/ui/Toaster.tsx` | `76-pipeline-avisos-globales/01-Toaster.tsx` |
| `shared/store/toast.store.ts` | `76-pipeline-avisos-globales/02-toast.store.ts` |
| `shared/hooks/useToggle.ts` | `76-pipeline-avisos-globales/03-useToggle.ts` |
| `shared/hooks/useTabs.ts` | `76-pipeline-avisos-globales/04-useTabs.ts` |

#### 77-pipeline-edicion-formularios

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `77-pipeline-edicion-formularios/01-LineItemsEditor.tsx` | `77-pipeline-edicion-formularios/00-director-edicion-formularios.ts` |
| `shared/ui/LineItemsEditor.tsx` | `77-pipeline-edicion-formularios/01-LineItemsEditor.tsx` |
| `shared/hooks/useLineItems.ts` | `77-pipeline-edicion-formularios/02-useLineItems.ts` |
| `shared/hooks/useFormState.ts` | `77-pipeline-edicion-formularios/03-useFormState.ts` |

#### 78-pipeline-cargos-documentos

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `78-pipeline-cargos-documentos/01-ExtraChargesEditor.tsx` | `78-pipeline-cargos-documentos/00-director-cargos-documentos.ts` |
| `shared/ui/ExtraChargesEditor.tsx` | `78-pipeline-cargos-documentos/01-ExtraChargesEditor.tsx` |
| `shared/hooks/useExtraCharges.ts` | `78-pipeline-cargos-documentos/02-useExtraCharges.ts` |
| `shared/lib/charges.ts` | `78-pipeline-cargos-documentos/03-charges.ts` |

#### 79-pipeline-consulta-documentos

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `79-pipeline-consulta-documentos/01-PdfPreviewModal.tsx` | `79-pipeline-consulta-documentos/00-director-consulta-documentos.ts` |
| `shared/ui/PdfPreviewModal.tsx` | `79-pipeline-consulta-documentos/01-PdfPreviewModal.tsx` |
| `shared/hooks/usePdfDocument.ts` | `79-pipeline-consulta-documentos/02-usePdfDocument.ts` |
| `shared/lib/pdf.ts` | `79-pipeline-consulta-documentos/03-pdf.ts` |
| `shared/lib/numberToWords.ts` | `79-pipeline-consulta-documentos/04-numberToWords.ts` |

#### 80-pipeline-galeria-imagenes

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `80-pipeline-galeria-imagenes/01-ImageLightbox.tsx` | `80-pipeline-galeria-imagenes/00-director-galeria-imagenes.ts` |
| `shared/ui/lightbox/ImageLightbox.tsx` | `80-pipeline-galeria-imagenes/01-ImageLightbox.tsx` |
| `shared/ui/lightbox/LightboxToolbar.tsx` | `80-pipeline-galeria-imagenes/02-LightboxToolbar.tsx` |
| `shared/ui/lightbox/LightboxThumbnails.tsx` | `80-pipeline-galeria-imagenes/03-LightboxThumbnails.tsx` |
| `shared/hooks/useLightbox.ts` | `80-pipeline-galeria-imagenes/04-useLightbox.ts` |

#### 81-pipeline-visualizacion-imagenes

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `81-pipeline-visualizacion-imagenes/01-SafeImage.tsx` | `81-pipeline-visualizacion-imagenes/00-director-visualizacion-imagenes.ts` |
| `shared/ui/SafeImage.tsx` | `81-pipeline-visualizacion-imagenes/01-SafeImage.tsx` |
| `shared/hooks/useImageViewer.ts` | `81-pipeline-visualizacion-imagenes/02-useImageViewer.ts` |
| `shared/hooks/useImageZoom.ts` | `81-pipeline-visualizacion-imagenes/03-useImageZoom.ts` |
| `shared/lib/image.ts` | `81-pipeline-visualizacion-imagenes/04-image.ts` |
| `shared/lib/initialsAvatar.ts` | `81-pipeline-visualizacion-imagenes/05-initialsAvatar.ts` |

#### 82-pipeline-calculo-importes

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `82-pipeline-calculo-importes/01-pricing.ts` | `82-pipeline-calculo-importes/00-director-calculo-importes.ts` |
| `shared/lib/pricing.ts` | `82-pipeline-calculo-importes/01-pricing.ts` |
| `shared/lib/currency.ts` | `82-pipeline-calculo-importes/02-currency.ts` |
| `shared/lib/sort.ts` | `82-pipeline-calculo-importes/03-sort.ts` |

#### 83-pipeline-recursos-publicos

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `83-pipeline-recursos-publicos/01-publicUrl.ts` | `83-pipeline-recursos-publicos/00-director-recursos-publicos.ts` |
| `shared/lib/publicUrl.ts` | `83-pipeline-recursos-publicos/01-publicUrl.ts` |
| `shared/lib/cn.ts` | `83-pipeline-recursos-publicos/02-cn.ts` |
| `shared/lib/events.ts` | `83-pipeline-recursos-publicos/03-events.ts` |
| `shared/lib/whatsapp.ts` | `83-pipeline-recursos-publicos/04-whatsapp.ts` |

#### 84-pipeline-persistencia-demo

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `84-pipeline-persistencia-demo/01-demoData.ts` | `84-pipeline-persistencia-demo/00-director-persistencia-demo.ts` |
| `shared/lib/demoData.ts` | `84-pipeline-persistencia-demo/01-demoData.ts` |
| `shared/lib/storage.ts` | `84-pipeline-persistencia-demo/02-storage.ts` |
| `shared/lib/download.ts` | `84-pipeline-persistencia-demo/03-download.ts` |
| `shared/lib/delay.ts` | `84-pipeline-persistencia-demo/04-delay.ts` |

#### 85-pipeline-identificadores-texto

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `85-pipeline-identificadores-texto/01-text.ts` | `85-pipeline-identificadores-texto/00-director-identificadores-texto.ts` |
| `shared/lib/text.ts` | `85-pipeline-identificadores-texto/01-text.ts` |
| `shared/lib/uid.ts` | `85-pipeline-identificadores-texto/02-uid.ts` |
| `shared/config/store.config.ts` | `85-pipeline-identificadores-texto/03-store.config.ts` |


### Datos mock / dummy

#### 86-pipeline-datos-demo-personas

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `86-pipeline-datos-demo-personas/01-roles.mock.ts` | `86-pipeline-datos-demo-personas/00-director-datos-demo-personas.ts` |
| `features/access/mocks/roles.mock.ts` | `86-pipeline-datos-demo-personas/01-roles.mock.ts` |
| `features/access/mocks/users.mock.ts` | `86-pipeline-datos-demo-personas/02-users.mock.ts` |
| `features/customers/mocks/customers.mock.ts` | `86-pipeline-datos-demo-personas/03-customers.mock.ts` |
| `features/interactions/mocks/reviews.mock.ts` | `86-pipeline-datos-demo-personas/04-reviews.mock.ts` |

#### 87-pipeline-datos-demo-productos

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `87-pipeline-datos-demo-productos/01-products.mock.ts` | `87-pipeline-datos-demo-productos/00-director-datos-demo-productos.ts` |
| `features/catalog/mocks/products.mock.ts` | `87-pipeline-datos-demo-productos/01-products.mock.ts` |
| `features/catalog/mocks/categories.mock.ts` | `87-pipeline-datos-demo-productos/02-categories.mock.ts` |
| `features/catalog/mocks/brands.mock.ts` | `87-pipeline-datos-demo-productos/03-brands.mock.ts` |
| `features/promotions/mocks/promotions.mock.ts` | `87-pipeline-datos-demo-productos/04-promotions.mock.ts` |

#### 88-pipeline-datos-demo-documentos

| Ruta actual | Ruta nueva |
| --- | --- |
| creado: reexporta `88-pipeline-datos-demo-documentos/01-orders.mock.ts` | `88-pipeline-datos-demo-documentos/00-director-datos-demo-documentos.ts` |
| `features/sales/mocks/orders.mock.ts` | `88-pipeline-datos-demo-documentos/01-orders.mock.ts` |
| `features/sales/mocks/channels.mock.ts` | `88-pipeline-datos-demo-documentos/02-channels.mock.ts` |
| `features/billing/mocks/invoices.mock.ts` | `88-pipeline-datos-demo-documentos/03-invoices.mock.ts` |
| `features/quotes/mocks/quotes.mock.ts` | `88-pipeline-datos-demo-documentos/04-quotes.mock.ts` |

### Documentación histórica conservada

| Ruta actual | Ruta nueva |
| --- | --- |
| `features/catalog/components/00Tree.html` | `00-documentacion/01-catalog-components-00Tree.html` |
| `features/catalog/components/detail/00Tree.html` | `00-documentacion/02-catalog-components-detail-00Tree.html` |
| `features/catalog/components/form/00Tree.html` | `00-documentacion/03-catalog-components-form-00Tree.html` |
| `features/catalog/components/form/tabs/00Tree.html` | `00-documentacion/04-catalog-components-form-tabs-00Tree.html` |
| `features/catalog/components/form/tabs/images/00Tree.html` | `00-documentacion/05-catalog-components-form-tabs-images-00Tree.html` |
| `features/catalog/components/grid/00Tree.html` | `00-documentacion/06-catalog-components-grid-00Tree.html` |
| `features/catalog/components/picker/00Tree.html` | `00-documentacion/07-catalog-components-picker-00Tree.html` |
| `features/catalog/components/table/00Tree.html` | `00-documentacion/08-catalog-components-table-00Tree.html` |
| `features/catalog/components/taxonomy/00Tree.html` | `00-documentacion/09-catalog-components-taxonomy-00Tree.html` |
| `features/catalog/components/toolbar/00Tree.html` | `00-documentacion/10-catalog-components-toolbar-00Tree.html` |
| `features/catalog/hooks/00Tree.html` | `00-documentacion/11-catalog-hooks-00Tree.html` |
| `features/catalog/hooks/form/00Tree.html` | `00-documentacion/12-catalog-hooks-form-00Tree.html` |
| `features/catalog/lib/00Tree.html` | `00-documentacion/13-catalog-lib-00Tree.html` |
| `features/catalog/mocks/00Tree.html` | `00-documentacion/14-catalog-mocks-00Tree.html` |
| `features/catalog/pages/00Tree.html` | `00-documentacion/15-catalog-pages-00Tree.html` |
| `features/settings/ESCALABILIDAD.md` | `00-documentacion/16-settings-ESCALABILIDAD.md` |

## Cierre

Migración en curso; las filas de ejecución reflejan los pasos ya comprobados.
