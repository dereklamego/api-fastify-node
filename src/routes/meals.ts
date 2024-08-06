import { FastifyInstance } from "fastify"
import { knex } from "../database"
import { z } from "zod"
import { randomUUID } from "node:crypto"
import { checkSessionIdExists } from "../middlewares/check-session-id-exists"
export async function mealsRoutes(app: FastifyInstance) {

  app.get('/',
    {
      preHandler: [checkSessionIdExists]
    }, async (request) => {
      const { sessionId } = request.cookies
      const meals = await knex('meals')
        .where('session_id', sessionId)
        .select()

      return { meals }
    })


  app.post('/',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const createMealBodySchema = z.object({
        name: z.string(),
        description: z.string(),
        is_on_diet: z.boolean(),
        date: z.coerce.date(),
      })

      const { name, description, is_on_diet, date } = createMealBodySchema.parse(request.body)

      await knex('meals').insert({
        id: randomUUID(),
        user_id: request.user?.id,
        name,
        description,
        is_on_diet,
        date: date.getTime(),

      })
      return reply.status(201).send('')
    })

  app.delete('/:mealId',
    { preHandler: [checkSessionIdExists] },

    async (request, reply) => {
      const paramSchema = z.object({ mealId: z.string().uuid() })

      const { mealId } = paramSchema.parse(request.params)

      if (!mealId) {
        return reply.status(404).send({ error: 'Meal not found' })
      }

      await knex('meals')
        .where('id', mealId)
        .delete()


      return reply.status(204).send()

    }
  )

  app.get('/:mealId',
    { preHandler: [checkSessionIdExists] },

    async (request, reply) => {
      const paramSchema = z.object({ mealId: z.string().uuid() })

      const { mealId } = paramSchema.parse(request.params)
      const meals = await knex('meals')
        .where('id', mealId)
        .select()

      if (meals.length === 0) {
        return reply.status(404).send({ error: "Meal not found" })
      }
      return meals
    })

  app.put('/:mealId',
    { preHandler: [checkSessionIdExists] },

    async (request, reply) => {
      const paramSchema = z.object({ mealId: z.string().uuid() })

      const { mealId } = paramSchema.parse(request.params)

      const updatedMealBodySchema = z.object({
        name: z.string(),
        description: z.string(),
        is_on_diet: z.boolean(),
        date: z.coerce.date()
      })

      const { name, description, is_on_diet, date } = updatedMealBodySchema.parse(request.body)

      const meal = await knex('meals')
        .where('id', mealId)
        .first()

      if (!meal) {
        return reply.status(404).send({ error: "Meal not found" })
      }

      await knex('meals').where({ id: mealId }).update({
        name,
        description,
        is_on_diet: is_on_diet,
        date: date.getTime()
      })
      return meal
    })


  app.patch('/:mealId',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const paramSchema = z.object({ mealId: z.string().uuid() })
      const { mealId } = paramSchema.parse(request.params)

      const patchMealBodySchema = z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        is_on_diet: z.boolean().optional(),
        date: z.coerce.date().optional()
      })

      const updates = patchMealBodySchema.parse(request.body)

      const meal = await knex('meals')
        .where('id', mealId)
        .first()

      if (!meal) {
        return reply.status(404).send({ error: "Meal not found" })
      }

      await knex('meals')
        .where({ id: mealId })
        .update({
          ...updates,
          date: updates.date ? updates.date.getTime() : meal.date  // Converter a data se for fornecida
        })

      return reply.status(200).send({ message: 'Meal updated successfully' })
    })

  app.get(
    '/metrics',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const totalMealsOnDiet = await knex('meals')
        .where({ user_id: request.user?.id, is_on_diet: true })
        .count('id', { as: 'total' })
        .first()

      const totalMealsOffDiet = await knex('meals')
        .where({ user_id: request.user?.id, is_on_diet: false })
        .count('id', { as: 'total' })
        .first()

      const totalMeals = await knex('meals')
        .where({ user_id: request.user?.id })
        .orderBy('date', 'desc')

      const { bestOnDietSequence } = totalMeals.reduce(
        (acc, meal) => {
          if (meal.is_on_diet) {
            acc.currentSequence += 1
          } else {
            acc.currentSequence = 0
          }

          if (acc.currentSequence > acc.bestOnDietSequence) {
            acc.bestOnDietSequence = acc.currentSequence
          }

          return acc
        },
        { bestOnDietSequence: 0, currentSequence: 0 },
      )

      return reply.send({
        totalMeals: totalMeals.length,
        totalMealsOnDiet: totalMealsOnDiet?.total,
        totalMealsOffDiet: totalMealsOffDiet?.total,
        bestOnDietSequence,
      })
    },
  )
}

