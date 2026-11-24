// Carga la configuración de pruebas (BD compustore_test, D-15). En CI llega por el entorno.
if (!process.env.DATABASE_URL) {
  try {
    process.loadEnvFile('.env.test')
  } catch {
    throw new Error('Falta api/.env.test (copia .env.example y apunta DATABASE_URL a compustore_test).')
  }
}
process.env.NODE_ENV = 'test'
