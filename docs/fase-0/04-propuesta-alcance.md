# 04 · Propuesta de alcance del backend

> **Objetivo:** convertir los hallazgos de Fase 0 en una propuesta de alcance priorizada para el backend y el modelo relacional.
> **Carácter:** propuesta sujeta a validación humana. Las prioridades no son decisiones definitivas; las que dependen del negocio se marcan **[P]**.
> **Fecha:** 2026-11-23 · **Fase:** 0 · **Estado:** análisis, sin implementación.

## 1. Punto de partida

| Indicador | Valor |
| --- | --- |
| Dominios inventariados | 19 (12 admin + 7 store) |
| Funcionalidades inventariadas | 64 (44 admin + 20 store) |
| Entidades candidatas | 24, más 1 editorial opcional |
| Backend actual | `/api` sin código de servidor |
| Persistencia actual | `localStorage` y mocks; sin concurrencia ni usuarios reales |
| Circuito comercial actual | Catálogo → carrito → WhatsApp; admin registra, reserva y factura manualmente |

**Conclusión de Fase 0:** el MVP debe priorizar una fuente única de catálogo, inventario y pedidos, con autenticación y permisos reales. La facturación interna cierra el circuito de stock; la integración fiscal real y los complementos pueden esperar.

---

## 2. Criterios de priorización

| Criterio | Pregunta |
| --- | --- |
| Dependencia funcional | ¿Otros módulos necesitan esta funcionalidad para operar? |
| Regla de negocio | ¿Sin ella se incumple una regla crítica o se corrompen datos? |
| Complejidad técnica | ¿Requiere transacciones, concurrencia, integración externa o migración? |
| Circuito comercial | ¿Es necesaria para completar catálogo → pedido → reserva → venta? |
| Riesgo de postergarla | ¿Aumenta el retrabajo o el riesgo operativo si se deja para después? |

---

## 3. MVP · Prioridad P0

> **Definición:** núcleo mínimo para operar con datos consistentes, permisos reales y un circuito de venta controlado. No incluye integración fiscal real ni captura automática de pedidos desde la tienda.

| ID | Funcionalidad | Justificación | Depende de | Complejidad |
| --- | --- | --- | --- | --- |
| P0-01 | Modelo relacional, claves canónicas y migración de mocks | Sin ids únicos no se pueden relacionar admin y store; es la base de todo | Decisiones D-01, D-02 | Alta |
| P0-02 | Autenticación de usuarios administrativos | Hoy el login es simulada en navegador; el RBAC no protege nada | P0-01 | Media |
| P0-03 | Usuarios, roles y accesos por vista | Replica las 10 vistas y 16 permisos; necesario para operar con equipo | P0-02 | Media |
| P0-04 | Catálogo administrativo: productos, categorías, marcas, specs, imágenes y lotes | Es la fuente de precios, stock y publicación | P0-01 | Alta |
| P0-05 | Inventario: stock, punto de reorden, lotes y ajustes | Sin stock confiable no hay reservas ni facturación | P0-04 | Media |
| P0-06 | Catálogo público y settings de tienda | Reemplaza los mocks del store y unifica identidad | P0-04, P0-05 | Media |
| P0-07 | Disponibilidad pública calculada | Evita prometer stock reservado; regla crítica del negocio | P0-05, P0-09 | Media |
| P0-08 | Clientes y deduplicación por teléfono | Pedidos, cotizaciones y facturas dependen del cliente | P0-01 | Media |
| P0-09 | Pedidos, ítems, cargos e historial | Es el centro del circuito comercial | P0-04, P0-08 | Alta |
| P0-10 | Reservas, vigencia y job de vencimiento | Evita sobreventa y libera stock sin depender del navegador | P0-09 | Alta |
| P0-11 | Máquina de estados y auditoría de transiciones | Evita cancelar/facturar en estados inválidos | P0-09, P0-10 | Media |
| P0-12 | Facturación interna: emisión, anulación, numeración y movimientos de stock | Cierra la venta y descuenta/repone inventario de forma atómica; el DTE real queda para P2 | P0-05, P0-11 | Alta |
| P0-13 | Contrato de errores, validaciones y paginación | Evita que cada endpoint invente respuestas | P0-01 | Baja |

**Resultado esperado de P0:** un producto creado en el admin aparece en la tienda con precio y disponibilidad consistentes; un pedido puede reservarse, facturarse y anularse sin descuadrar stock; los permisos se validan en servidor.

**Fuera de P0:** DTE real, cotizaciones, ofertas integradas, reseñas end-to-end, captura automática de pedidos web, respaldo administrado.

---

## 4. Prioridad P1

> **Definición:** funcionalidades importantes que completan la operación, pero que pueden implementarse después de estabilizar catálogo, pedidos y facturación.

| ID | Funcionalidad | Justificación | Depende de | Complejidad |
| --- | --- | --- | --- | --- |
| P1-01 | Cotizaciones y conversión a pedido | Canal comercial formal; reutiliza clientes, catálogo y pedidos | P0-08, P0-09 | Media |
| P1-02 | Ofertas y precio efectivo en tienda | Alinea promociones con precios reales y evita descuentos manuales | P0-04, P0-06 | Media |
| P1-03 | Captura de solicitud de pedido desde la tienda | Hoy WhatsApp no deja rastro; habilita métricas y reserva | P0-07, P0-09, P0-10 | Alta |
| P1-04 | Reseñas end-to-end con moderación | Une las dos fuentes actuales y elimina el fallback ficticio | P0-04 | Media |
| P1-05 | Métricas de tablero y reportes básicos | Reemplaza cálculos locales; útil para operación | P0-05, P0-09, P0-12 | Media |
| P1-06 | Canales de venta y etiquetas de estado administrables | Da soporte al canal web/WhatsApp y a la operación | P0-09 | Baja |
| P1-07 | Historial y estadísticas de cliente | Reemplaza el cálculo local por consultas consistentes | P0-08, P0-09 | Baja |
| P1-08 | Respaldos y restauración en servidor | Hoy el respaldo es un JSON descargado desde el navegador y no se encontró restauración | P0-01 | Media |

**Resultado esperado de P1:** el admin puede cotizar, aplicar ofertas reales, recibir solicitudes web y moderar reseñas; la operación deja de depender de datos locales.

---

## 5. Prioridad P2

> **Definición:** complementarias, futuras o dependientes de terceros. No bloquean el MVP.

| ID | Funcionalidad | Justificación | Depende de | Complejidad |
| --- | --- | --- | --- | --- |
| P2-01 | DTE real y transmisión a Hacienda | Hoy el sello es simulado; requiere integración, certificación y cumplimiento fiscal | P0-12, D-07 | Muy alta |
| P2-02 | Notas de crédito y devoluciones | No existen en el código; la anulación actual no es un flujo de devolución | P2-01 | Alta |
| P2-03 | Administración de promociones de portada | Hoy son contenido estático; no afectan precios | P0-06 | Baja |
| P2-04 | Cuentas de cliente, favoritos y carrito en servidor | Hoy no hay autenticación de cliente; requiere decisión de producto | D-06 | Alta |
| P2-05 | Historial de precios y auditoría avanzada | Los documentos ya guardan snapshots; un historial completo es analítico | P0-04 | Media |
| P2-06 | Reportes fiscales y contables | Depende de DTE real y del tratamiento de IVA | P2-01, D-07 | Alta |
| P2-07 | Analítica de conversión y embudos | Depende de captura de pedidos web y eventos | P1-03 | Media |

**[P]** P2-02, P2-04, P2-05 y P2-07 no tienen implementación actual; se incluyen como opciones, no como requisitos comprobados.

---

## 6. Dependencias y orden de implementación

```text
Fase 0: documentos aprobados y decisiones D-01…D-18 resueltas o diferidas

Bloque A · Fundación
  P0-01 Modelo e ids
      ├── P0-02 Autenticación
      │      └── P0-03 Usuarios/RBAC
      └── P0-13 Contrato de errores

Bloque B · Catálogo e inventario
  P0-01 → P0-04 Catálogo → P0-05 Inventario
      ├── P0-06 Catálogo público + settings
      └── P0-08 Clientes

Bloque C · Pedidos
  P0-04 + P0-05 + P0-08 → P0-09 Pedidos
      ├── P0-10 Reservas + job
      └── P0-11 Transiciones

Bloque D · Cierre de venta
  P0-05 + P0-09 + P0-10 + P0-11 → P0-12 Facturación interna
  P0-05 + P0-10 → P0-07 Disponibilidad pública

Bloque E · P1
  P0-08 + P0-09 → P1-01 Cotizaciones
  P0-04 + P0-06 → P1-02 Ofertas
  P0-07 + P0-09 + P0-10 → P1-03 Pedidos desde tienda
  P0-04 → P1-04 Reseñas
  P0-05 + P0-09 + P0-12 → P1-05 Métricas
  P0-09 → P1-06 Canales/etiquetas
  P0-08 + P0-09 → P1-07 Historial de cliente
  P0-01 → P1-08 Respaldos

Bloque F · P2
  P0-12 + D-07 → P2-01 DTE real → P2-06 Reportes fiscales
  P1-03 → P2-07 Analítica
```

**Regla de secuencia:** no iniciar P1-01, P1-02 ni P1-03 antes de que P0-09, P0-10 y P0-12 estén estables; de lo contrario se duplican reglas de stock y totales.

---

## 7. Decisiones pendientes de negocio

| ID | Decisión | Opciones | Impacto | Bloquea |
| --- | --- | --- | --- | --- |
| D-01 | Identificador canónico de producto | Mantener `PRD-###`; usar numérico; nuevo UUID + slug público | Diseño de PK/FK, URLs y migración | P0-01, P0-06 |
| D-02 | Marca por nombre o FK | `brand` texto vs `brandId` | Integridad y renombres | P0-01, P0-04 |
| D-03 | Facturas por pedido | Una activa; historial de anuladas; varias históricas | Modelo de `Invoice`, unicidad y reportes | P0-01, P0-12 |
| D-04 | Reserva visible en tienda | Ocultar si `available = 0`; mostrar agotado; permitir preventa | Regla de catálogo y expectativa del cliente | P0-07 |
| D-05 | Captura de pedido web | Solo WhatsApp; solicitud sin reserva; pedido `registrado` con reserva | Alcance de P1-03 y modelo de pedido | P1-03 |
| D-06 | Identidad de cliente | Invitado; teléfono único; cuenta con login | Clientes, favoritos, historial y RGPD | P0-08, P2-04 |
| D-07 | Tratamiento fiscal | IVA incluido sin desglose; IVA desglosado; DTE real | Facturación, reportes y cumplimiento | P0-12, P2-01 |
| D-08 | Fuente canónica de reseñas | Solo admin; solo store; entidad única | Moderación y datos públicos | P1-04 |
| D-09 | Acumulación de ofertas | Una sola oferta; varias acumulables; prioridad por campaña | Precio efectivo y margen | P1-02 |
| D-10 | Promociones de portada | Contenido estático; CMS del admin; campañas vinculadas a ofertas | Modelo editorial | P2-03 |
| D-11 | Stock como saldo o kardex | Saldo mutable; movimientos auditables | Inventario, auditoría y costos | P0-05 |
| D-12 | Estados de cotización | Calcular `vencida`/`convertida`; materializarlos | Consultas y reportes | P1-01 |
| D-13 | Política de borrado | Físico; lógico; histórico inmutable | Todas las entidades | P0-01 |
| D-14 | Matriz final de roles | Mantener 5 plantillas; roles personalizados | RBAC y operación | P0-03 |
| D-15 | Historial de precios | No implementar; tabla de cambios; snapshots only | Reportes y auditoría | P2-05 |
| D-16 | Costo de envío | Gratis; tarifa fija; cotización manual por WhatsApp | Checkout y totales | P1-03 |
| D-17 | Anulación después de entregar | Bloquear; devolución; nota de crédito | Facturación y postventa | P2-02 |
| D-18 | Ámbito de numeración | Un establecimiento; varios puntos de venta | Secuencias y DTE | P0-12, P2-01 |

> Todas las decisiones D-01 a D-18 requieren **validación humana**. Ninguna se considera resuelta por el código actual, aunque exista una simulación.

---

## 8. Riesgos para la entrega

| ID | Riesgo | Probabilidad | Impacto | Mitigación |
| --- | --- | --- | --- | --- |
| RG-01 | Ampliar el alcance con DTE real antes de estabilizar el núcleo | Alta | Alto | Congelar P0; tratar DTE como P2 |
| RG-02 | Migración de ids y datos mock con pérdida de correspondencia | Alta | Alto | Mapeo explícito, scripts de verificación y datos de prueba |
| RG-03 | Sobreventa por concurrencia en reservas y facturación | Media | Alto | Transacciones T1–T3 y bloqueo de filas |
| RG-04 | Factura emitida sin descuento de stock o viceversa | Media | Alto | Transacción única y pruebas de fallo |
| RG-05 | Reservas que nunca vencen si el job falla | Media | Alto | Job idempotente, monitoreo y reintentos |
| RG-06 | Reglas simuladas tratadas como definitivas | Alta | Medio | Revisión con negocio; marcar [P] |
| RG-07 | Checkout WhatsApp sin trazabilidad ni reserva | Alta | Medio | Decidir D-05; no prometer stock sin API |
| RG-08 | Duplicidad de clientes por teléfono/correo | Media | Medio | Normalización y restricción única |
| RG-09 | Pérdida de datos locales al migrar | Media | Medio | Exportar respaldos antes de cortar |
| RG-10 | Incumplimiento fiscal por IVA o DTE incompletos | Media | Alto | Validación contable antes de producción |
| RG-11 | Reseñas falsas o spam | Media | Bajo | Moderación, rate limit y compra verificada si se decide |
| RG-12 | Cambios de contrato que rompan ambos frontends | Media | Medio | Versionado de API y contratos acordados |
| RG-13 | Seeds inconsistentes entre admin y store | Alta | Medio | Una sola fuente y pruebas de paridad |
| RG-14 | Errores de zona horaria en reservas y vencimientos | Media | Medio | UTC en servidor y zona de negocio explícita |
| RG-15 | Matriz de permisos no validada por el negocio | Media | Medio | Taller de roles antes de P0-03 |
| RG-16 | Bajo rendimiento al calcular disponibilidad en cada consulta | Baja | Medio | Índices y caché si el volumen lo exige |
| RG-17 | Respaldo sin restauración verificada | Media | Medio | Probar exportación e importación antes de producción |
| RG-18 | `/api` sin framework ni decisiones de infraestructura | Alta | Medio | Definir stack antes de P0-01 |

---

## 9. Criterios verificables para cerrar la Fase 0

La Fase 0 se considera cerrada cuando se cumplen **todos** estos puntos:

- [ ] Los cuatro documentos existen, están revisados y no se contradicen entre sí.
- [ ] El 100 % de las funcionalidades P0, P1 y P2 está vinculado a al menos una entidad y una operación de API.
- [ ] Cada regla de la matriz tiene evidencia en una ruta de archivo o está marcada explícitamente como **[P]**.
- [ ] El modelo candidato define PK, FK, unicidad, nulabilidad y cardinalidades para las 24 entidades.
- [ ] Las operaciones de escritura tienen contrato de entrada, salida y errores.
- [ ] Las transacciones T1–T8 están aceptadas por el equipo técnico.
- [ ] Las decisiones D-01 a D-18 están resueltas o diferidas con responsable y fecha.
- [ ] Se aprobó qué datos son fuente de verdad y cuáles derivados.
- [ ] Se identificó la estrategia de migración de ids y de datos mock.
- [ ] Se validó el alcance fiscal con contabilidad o asesoría legal.
- [ ] No se creó ninguna tabla, endpoint, migración ni cambio de código durante la Fase 0.
- [ ] Negocio, tecnología y fiscalidad dieron visto bueno al alcance P0.

### 9.1 Escenarios de aceptación de P0

| # | Escenario | Resultado esperado |
| --- | --- | --- |
| E-01 | Crear un producto en admin y consultarlo en la tienda | Mismo id canónico, precio, imágenes y disponibilidad |
| E-02 | Reservar un pedido | La disponibilidad pública baja exactamente en las unidades reservadas |
| E-03 | Vencer la reserva | El pedido vuelve a `registrado` y la disponibilidad se restaura sin intervención |
| E-04 | Facturar un pedido | Se crea una sola factura, se descuenta stock una sola vez y el pedido queda `facturado` |
| E-05 | Anular la factura | Se repone solo el stock de productos, la factura queda `anulada` y el pedido se reabre |
| E-06 | Intentar facturar dos veces | La segunda operación se rechaza sin efectos |
| E-07 | Usuario sin permiso intenta emitir factura | La API responde 403 y no hay cambios |
| E-08 | Dos solicitudes concurrentes de reserva | Solo una consume el stock disponible; la otra recibe conflicto |
| E-09 | Emitir facturas concurrentes | No se repite ningún número de control ni correlativo interno |
| E-10 | Eliminar un pedido facturado | La operación se rechaza y el pedido permanece |
| E-11 | Aprobar una reseña | Aparece en la tienda; una pendiente no aparece |
| E-12 | Reiniciar el servidor | Los datos persisten; no dependen de `localStorage` |

---

## 10. Qué no incluye esta propuesta

- Implementación de endpoints, tablas, migraciones o infraestructura.
- Rediseño de UI o de arquitectura frontend.
- Integración real con Hacienda.
- Pasarela de pagos.
- Cuentas de cliente o autenticación pública.
- Aplicación móvil, multi-sucursal o logística avanzada.
- Cambios al documento maestro de implementación.

---

## 11. Recomendación final

1. **Aprobar primero el modelo y las decisiones D-01, D-02, D-03, D-04, D-06, D-07 y D-11.** Son las que más impacto tienen en tablas y contratos.
2. **Implementar P0 en el orden de los bloques A–D.** No abrir P1 antes de estabilizar facturación y reservas.
3. **Tratar la facturación interna como cierre del MVP**, dejando el DTE real como P2.
4. **No prometer disponibilidad en la tienda hasta que P0-07 esté operativo.** El checkout actual no reserva stock.
5. **Cerrar Fase 0 con los escenarios E-01 a E-12 acordados**, no solo con documentos aprobados.

---

## 12. Documentos relacionados

- [`01-inventario-admin.md`](./01-inventario-admin.md)
- [`02-inventario-store.md`](./02-inventario-store.md)
- [`03-matriz-integracion.md`](./03-matriz-integracion.md)
- `admin/arch-backOffice.md`
- `store/arch-fronOffice.md`
- `README.md`
