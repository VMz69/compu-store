import type { ProductReview } from '../features/interactions/types'

const review = (
  id: string, productId: string, productName: string, author: string, city: string, rating: number,
  comment: string, createdAt: string, status: ProductReview['status'] = 'pendiente', rejectReason = '',
): ProductReview => ({
  id, productId, productName, author, city, rating, comment, createdAt, status, rejectReason,
  moderatedBy: status === 'pendiente' ? null : 'Licda. Sofía Alvarado',
  moderatedAt: status === 'pendiente' ? null : '2026-11-05T10:00:00.000Z',
})

/**
 * Comentarios de prueba tal como llegarían desde el Front Office (formulario de
 * reseñas de la ficha de producto). Los productos existen en `catalog/products.mock`.
 */
export const REVIEWS_MOCK: ProductReview[] = [
  review('REV-008', 'PRD-001', 'Laptop Acer Aspire 5 Refurbished', 'Daniela P.', 'Cojutepeque', 5, 'Llegó impecable y la batería dura toda la jornada. Muy buena atención en sala de ventas.', '2026-11-08T16:20:00.000Z'),
  review('REV-007', 'PRD-004', 'Teclado Mecánico RGB Redragon Gamer', 'Josué M.', 'San Rafael Cedros', 2, 'A la semana una tecla dejó de responder. Espero que me atiendan la garantía.', '2026-11-08T11:05:00.000Z'),
  review('REV-006', 'PRD-006', 'Audífonos Gaming Diadema 7.1 Surround', 'xXgamerXx', 'San Salvador', 1, 'COMPREN EN OTRO LADO!!! Visiten www.ofertas-baratas.example para mejores precios', '2026-11-07T22:40:00.000Z'),
  review('REV-005', 'PRD-003', 'Disco M.2 1 TB SAMSUNG NVMe 980', 'Kevin R.', 'Cojutepeque', 5, 'Me lo instalaron en tienda y clonaron mi disco anterior. Arranque en segundos.', '2026-11-06T09:30:00.000Z', 'aprobado'),
  review('REV-004', 'PRD-009', 'Laptop HP ProBook 450 G8 Core i5', 'Ing. Marvin C.', 'San Salvador', 4, 'Compramos tres para el despacho. Rinden bien; el teclado podría ser mejor.', '2026-11-04T14:10:00.000Z', 'aprobado'),
  review('REV-003', 'PRD-010', 'Audífonos Inalámbricos JBL Pure Bass', 'Gabriela S.', 'Santa Ana', 4, 'Suenan muy bien y la batería rinde varios días. Cómodos para usar todo el día.', '2026-11-03T18:00:00.000Z', 'aprobado'),
  review('REV-002', 'PRD-005', 'Mouse Inalámbrico Logitech M185', 'Anónimo', 'El Salvador', 3, 'ok', '2026-11-02T08:45:00.000Z', 'rechazado', 'Comentario sin contenido útil.'),
  review('REV-001', 'PRD-011', 'Memoria RAM Kingston Fury Beast 16GB DDR4', 'Andrea M.', 'San Pedro Perulapán', 5, 'Me ayudaron a elegir la RAM compatible con mi equipo. Excelente servicio.', '2026-11-01T12:00:00.000Z', 'aprobado'),
]
