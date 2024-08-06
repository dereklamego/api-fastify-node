import 'fastify'

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string
      // Adicione outras propriedades do usuário, se necessário
    }
  }
}