/** Latencia simulada para las acciones de los stores en modo mocking-first. */
export const MOCK_LATENCY_MS = 350

export const delay = (ms: number = MOCK_LATENCY_MS): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms))
