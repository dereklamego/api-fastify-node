import { FastifyInstance } from "fastify"
import { knex } from "../database"
import { z } from "zod"
import { randomUUID } from "crypto"
import { checkSessionIdExists } from "../middlewares/check-session-id-exists"


export async function userRoutes(app: FastifyInstance) {

  app.post('/',
    async (request, reply) => {

      const createUserBodySchema = z.object({
        name: z.string(),
        email: z.string().email()
      })
      const { name, email } = createUserBodySchema.parse(request.body)

      const userByEmail = await knex('users')
        .where({
          email
        })
        .first()


      if (userByEmail) {
        return reply.status(401).send({ message: 'User already exists' })
      }

      let sessionId = request.cookies.session_id

      if (!sessionId) {
        sessionId = randomUUID()

        reply.setCookie('sessionId', sessionId, {
          path: '/',
          maxAge: 60 * 60 * 24 * 7
        })
      }

      await knex('users').insert({
        id: randomUUID(),
        session_id: sessionId,
        name,
        email
      })
      return reply.status(201).send('')
    })

}