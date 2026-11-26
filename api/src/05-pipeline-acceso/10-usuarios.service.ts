import { CorreoEnUso, prisma, type ProveedorIdentidad } from '../03-pipeline-conexiones/00-director-conexiones.js'
import { ErrorApp } from '../04-pipeline-http/00-director-http.js'
import { aSesionCon, type Sesion } from './03-acceso.service.js'
import { clavesDePlantilla, type Usuario } from './04-acceso.repository.js'
import { ACCESO_TOTAL, clavesDe, normalizarAccesos, SUPERADMIN, type Accesos } from './06-permisos.catalogo.js'
import { accesosEfectivos } from './07-requiere-permiso.js'
import type { AccesosEntrada, CrearUsuario, EditarUsuario, RestablecerContrasena } from './09-usuarios.schema.js'
import * as repo from './11-usuarios.repository.js'

/**
 * Usuarios del panel (L09). Reglas que impone el servidor:
 *  · Protección: siempre queda un superadmin activo; nadie se elimina, se desactiva, cambia su rol
 *    ni edita sus propios accesos (422).
 *  · Escalada: solo un superadmin asigna el rol superadmin o toca cuentas superadmin, y quien no es
 *    superadmin solo otorga vistas y acciones que él mismo tiene (403).
 *  · Firebase y la BD quedan sincronizados: las llamadas al proveedor van dentro de la transacción
 *    (si fallan, la BD se revierte) y el alta compensa borrando la cuenta si la BD falla.
 */

/** Las llamadas a Firebase alargan la transacción: margen sobre los 5 s por defecto. */
const OPCIONES_TX = { timeout: 15_000, maxWait: 10_000 }

const esSuper = (u: Pick<Usuario, 'rol'>) => u.rol === SUPERADMIN

const aDto = (u: repo.UsuarioConPermisos): Sesion =>
  aSesionCon(u, esSuper(u) ? ACCESO_TOTAL : normalizarAccesos(u.permisos.map((p) => p.permisoClave)))

const negocio = (mensaje: string) => new ErrorApp('BUSINESS_RULE', 422, mensaje)
const denegado = (mensaje: string) => new ErrorApp('PERMISSION_DENIED', 403, mensaje)
const noExiste = () => new ErrorApp('NOT_FOUND', 404, 'El usuario no existe.')
const correoRepetido = () => new ErrorApp('CONFLICT', 409, 'Ya existe un usuario con este correo.')

const MENSAJES = {
  ultimoSuper: 'Debe existir al menos un Super Administrador activo.',
  soloSuper: 'Solo un Super Administrador puede gestionar cuentas o el rol de Super Administrador.',
  otorgarDeMas: 'No puedes otorgar vistas o acciones que tú no tienes.',
} as const

/** Accesos de la plantilla de un rol (superadmin: todo). */
async function accesosDePlantilla(rol: string): Promise<Accesos> {
  return rol === SUPERADMIN ? ACCESO_TOTAL : normalizarAccesos(await clavesDePlantilla(rol))
}

function exigirPuedeTocar(actor: Usuario, objetivo: Pick<Usuario, 'rol'>): void {
  if (esSuper(objetivo) && !esSuper(actor)) throw denegado(MENSAJES.soloSuper)
}

/** Quien no es superadmin solo otorga lo que tiene (se comparan solo las claves nuevas). */
async function exigirPuedeOtorgar(actor: Usuario, nuevas: Accesos, actuales: Accesos | null = null): Promise<void> {
  if (esSuper(actor)) return
  const propias = new Set<string>(clavesDe(await accesosEfectivos(actor)))
  const previas = new Set<string>(actuales ? clavesDe(actuales) : [])
  if (clavesDe(nuevas).some((clave) => !previas.has(clave) && !propias.has(clave))) throw denegado(MENSAJES.otorgarDeMas)
}

export async function listar(): Promise<Sesion[]> {
  return (await repo.listar()).map(aDto)
}

export async function crear(actor: Usuario, datos: CrearUsuario, identidad: ProveedorIdentidad): Promise<Sesion> {
  if (datos.rol === SUPERADMIN && !esSuper(actor)) throw denegado(MENSAJES.soloSuper)
  const plantilla = await accesosDePlantilla(datos.rol)
  await exigirPuedeOtorgar(actor, plantilla)
  if (await repo.correoEnUso(prisma, datos.correo)) throw correoRepetido()

  let uid: string
  try {
    uid = await identidad.crearCuenta(datos.correo, datos.contrasena)
  } catch (error) {
    if (error instanceof CorreoEnUso) throw new ErrorApp('CONFLICT', 409, 'Ese correo ya tiene una cuenta en Firebase. Vincúlala con `pnpm usuarios:vincular`.')
    throw error
  }

  try {
    if (!datos.activo) await identidad.actualizarCuenta(uid, { deshabilitada: true })
    const creado = await repo.crear({
      firebaseUid: uid,
      correo: datos.correo,
      nombre: datos.nombre,
      telefono: datos.telefono,
      rol: datos.rol,
      activo: datos.activo,
      debeCambiarContrasena: datos.debeCambiarContrasena,
      permisos: esSuper(datos) ? [] : clavesDe(plantilla),
    })
    return aDto(creado)
  } catch (error) {
    // Compensación: sin registro en la BD, la cuenta de Firebase no debe quedar huérfana.
    await identidad.eliminarCuenta(uid).catch(() => undefined)
    if (repo.esCorreoDuplicado(error)) throw correoRepetido()
    throw error
  }
}

export async function editar(actor: Usuario, id: number, cambios: EditarUsuario, identidad: ProveedorIdentidad): Promise<Sesion> {
  await prisma.$transaction(async (tx) => {
    const superActivos = await repo.bloquearSuperadminsActivos(tx)
    const objetivo = await repo.bloquear(tx, id)
    if (!objetivo) throw noExiste()
    exigirPuedeTocar(actor, objetivo)
    if (cambios.rol === SUPERADMIN && !esSuper(actor)) throw denegado(MENSAJES.soloSuper)

    const cambiaRol = cambios.rol !== undefined && cambios.rol !== objetivo.rol
    const desactiva = cambios.activo === false && objetivo.activo
    const cambiaCorreo = cambios.correo !== undefined && cambios.correo !== objetivo.correo

    if (objetivo.id === actor.id && cambiaRol) throw negocio('No puedes cambiar tu propio rol.')
    if (objetivo.id === actor.id && desactiva) throw negocio('No puedes desactivar tu propia cuenta.')
    if (esSuper(objetivo) && objetivo.activo && (cambiaRol || desactiva) && superActivos.length <= 1) throw negocio(MENSAJES.ultimoSuper)
    if (cambiaCorreo && (await repo.correoEnUso(tx, cambios.correo!, id))) throw correoRepetido()

    if (cambiaRol) {
      const plantilla = await accesosDePlantilla(cambios.rol!)
      await exigirPuedeOtorgar(actor, plantilla)
      await repo.reemplazarPermisos(tx, id, cambios.rol === SUPERADMIN ? [] : clavesDe(plantilla))
    }
    await repo.actualizar(tx, id, cambios)

    const reactiva = cambios.activo === true && !objetivo.activo
    if (cambiaCorreo || desactiva || reactiva) {
      try {
        await identidad.actualizarCuenta(objetivo.firebaseUid, {
          ...(cambiaCorreo ? { correo: cambios.correo! } : {}),
          ...(desactiva ? { deshabilitada: true } : reactiva ? { deshabilitada: false } : {}),
        })
      } catch (error) {
        if (error instanceof CorreoEnUso) throw new ErrorApp('CONFLICT', 409, 'Ese correo ya tiene otra cuenta en Firebase.')
        throw error
      }
    }
  }, OPCIONES_TX)
  return aDto(await repo.obtener(id))
}

export async function cambiarAccesos(actor: Usuario, id: number, entrada: AccesosEntrada): Promise<Sesion> {
  const objetivo = await repo.obtenerOpcional(id)
  if (!objetivo) throw noExiste()
  if (objetivo.id === actor.id) throw negocio('No puedes modificar tus propios accesos. Pide a otro administrador que lo haga.')
  if (esSuper(objetivo)) throw negocio('El Administrador de Sistema tiene acceso total. Sus permisos no se editan.')

  const accesos = normalizarAccesos([...entrada.vistas, ...entrada.acciones])
  if (accesos.vistas.length === 0) throw negocio('El usuario necesita al menos una vista habilitada.')
  await exigirPuedeOtorgar(actor, accesos, aDto(objetivo).accesos)

  await prisma.$transaction((tx) => repo.reemplazarPermisos(tx, id, clavesDe(accesos)))
  return aDto(await repo.obtener(id))
}

export async function restablecerContrasena(
  actor: Usuario,
  id: number,
  { contrasena, debeCambiarContrasena }: RestablecerContrasena,
  identidad: Pick<ProveedorIdentidad, 'actualizarContrasena'>,
): Promise<void> {
  const objetivo = await repo.obtenerOpcional(id)
  if (!objetivo) throw noExiste()
  if (objetivo.id === actor.id) throw negocio('Para tu propia contraseña usa «Cambiar contraseña».')
  exigirPuedeTocar(actor, objetivo)
  // El proveedor revoca las sesiones abiertas; después se fija la obligación de cambiarla.
  await identidad.actualizarContrasena(objetivo.firebaseUid, contrasena)
  await repo.actualizar(prisma, id, { debeCambiarContrasena })
}

export async function eliminar(actor: Usuario, id: number, identidad: Pick<ProveedorIdentidad, 'eliminarCuenta'>): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const superActivos = await repo.bloquearSuperadminsActivos(tx)
    const objetivo = await repo.bloquear(tx, id)
    if (!objetivo) throw noExiste()
    if (objetivo.id === actor.id) throw negocio('No puedes eliminar tu propia cuenta.')
    exigirPuedeTocar(actor, objetivo)
    if (esSuper(objetivo) && objetivo.activo && superActivos.length <= 1) throw negocio('Es el único Super Administrador activo.')
    if ((await repo.contarMovimientos(tx, id)) > 0) {
      throw new ErrorApp('CONFLICT', 409, 'Tiene historial de inventario: desactívalo en su lugar.')
    }
    // Primero la BD; solo si el borrado procede se elimina la cuenta en Firebase (antes del commit:
    // si Firebase falla, la BD se revierte).
    await repo.borrar(tx, id)
    await identidad.eliminarCuenta(objetivo.firebaseUid)
  }, OPCIONES_TX)
}
