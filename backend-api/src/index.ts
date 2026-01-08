import Fastify from 'fastify'

async function start() {
  const app = Fastify({ 
    logger: {
      level: 'info',
      transport: {
        target: 'pino-pretty'
      }
    }
  })

  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() }
  })

  try {
    await app.listen({ port: 3000, host: '0.0.0.0' })
    console.log('✅ Server READY on http://localhost:3000')
    
    // CRÍTICO: Mantener el proceso vivo
    process.on('SIGINT', async () => {
      console.log('\n⚠️  Shutting down...')
      await app.close()
      process.exit(0)
    })
  } catch (err) {
    console.error('❌ Fatal error:', err)
    process.exit(1)
  }
}

// EJECUTAR y capturar errores globales
start().catch((err) => {
  console.error('💥 Unhandled error:', err)
  process.exit(1)
})
