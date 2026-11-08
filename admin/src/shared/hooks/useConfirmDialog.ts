import { useConfirmStore } from '@/shared/store/confirm.store'

/** Estado y acciones del diálogo global de confirmación. */
export function useConfirmDialog() {
  const request = useConfirmStore((s) => s.request)
  const close = useConfirmStore((s) => s.close)
  const accept = useConfirmStore((s) => s.accept)
  return { request, isOpen: request !== null, close, accept }
}
