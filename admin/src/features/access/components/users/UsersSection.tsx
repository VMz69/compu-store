import { BackLink, Button, DataTable, EmptyState, ListToolbar, LiveSearch, PageContainer, Select, type TableHeader } from '@/00-director-interfaz'
import { tracer } from '@/00-trazabilidad'
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

/** Directorio de usuarios: barra estándar (buscador · rol ··· conteo · alta) + tabla. Sin título propio. */
export function UsersSection() {
  const admin = useUsersAdmin()
  const headers = admin.canManage ? [...HEADERS, ACTIONS_HEADER] : HEADERS

  return (
    <>
      <ListToolbar
        traceId="settings.users"
        back={<BackLink to="/ajustes" label="Ajustes" {...t('settings.back')} />}
        search={
          <LiveSearch
            value={admin.search}
            onChange={admin.onSearch}
            onClear={admin.clearSearch}
            resultCount={admin.rows.length}
            placeholder="Buscar nombre, correo o teléfono…"
            aria-label="Buscar usuarios"
            {...t('settings.users.search')}
          />
        }
        filters={<Select tone="filter" options={admin.roleOptions} value={admin.roleFilter} onChange={admin.onRoleFilter} aria-label="Filtrar por rol" {...t('settings.users.role-filter')} />}
        aside={<span className="hidden md:inline text-[11px] font-bold text-slate-400 tabular-nums">{admin.activeCount} activos de {admin.total}</span>}
        action={
          admin.canManage && (
            <Button icon="fa-solid fa-user-plus" onClick={admin.openCreate} {...t('settings.users.create')}>
              Nuevo usuario
            </Button>
          )
        }
      />
      <PageContainer className="flex-1 min-h-0" {...t('settings.users.content')}>
        {admin.rows.length === 0 ? (
          <EmptyState icon="fa-solid fa-user-slash" title="Ningún usuario coincide con la búsqueda." className="py-10" />
        ) : (
          <DataTable headers={headers} {...t('settings.users.table')}>
            {admin.rows.map((row) => (
              <UserRow key={row.user.id} row={row} actions={admin} />
            ))}
          </DataTable>
        )}
      </PageContainer>
    </>
  )
}
