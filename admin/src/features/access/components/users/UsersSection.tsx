import { Button, CardTitle, DataTable, EmptyState, SearchInput, Select, type TableHeader } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import { useUsersAdmin } from '../../hooks/useUsersAdmin'
import { UserRow } from './UserRow'

const t = tracer('UsersSection', 'src/features/access/components/users/UsersSection.tsx')

const HEADERS: TableHeader[] = [
  { label: 'Colaborador', className: 'px-4' },
  { label: 'Teléfono' },
  { label: 'Rol' },
  { label: 'Estado' },
  { label: 'Último acceso' },
]
const ACTIONS_HEADER: TableHeader = { label: 'Acciones', className: 'px-4 text-right' }

/** Directorio de usuarios del sistema con búsqueda, filtro por rol y CRUD. */
export function UsersSection() {
  const admin = useUsersAdmin()
  const headers = admin.canManage ? [...HEADERS, ACTIONS_HEADER] : HEADERS

  return (
    <section className="space-y-3" {...t('settings.users')}>
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3">
        <div>
          <CardTitle>Usuarios del sistema</CardTitle>
          <p className="text-[11px] text-slate-400">
            {admin.activeCount} activos de {admin.total}. Cada usuario inicia sesión con su correo y contraseña.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput
            value={admin.search}
            onChange={admin.onSearch}
            placeholder="Buscar por nombre, correo o teléfono…"
            aria-label="Buscar usuarios"
            {...t('settings.users.search')}
          />
          <Select
            tone="filter"
            options={admin.roleOptions}
            value={admin.roleFilter}
            onChange={admin.onRoleFilter}
            aria-label="Filtrar por rol"
            {...t('settings.users.role-filter')}
          />
          {admin.canManage && (
            <Button icon="fa-solid fa-user-plus" onClick={admin.openCreate} {...t('settings.users.create')}>
              Nuevo usuario
            </Button>
          )}
        </div>
      </div>

      {admin.rows.length === 0 ? (
        <EmptyState icon="fa-solid fa-user-slash" title="Ningún usuario coincide con la búsqueda." className="py-10" />
      ) : (
        <DataTable headers={headers} {...t('settings.users.table')}>
          {admin.rows.map((row) => (
            <UserRow key={row.user.id} row={row} actions={admin} />
          ))}
        </DataTable>
      )}
    </section>
  )
}
