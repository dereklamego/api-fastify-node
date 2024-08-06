import fastify from "fastify"
import cookie from '@fastify/cookie'
import { mealsRoutes } from "./routes/meals"
import { userRoutes } from "./routes/users"



export const app = fastify()

app.register(cookie)
app.register(userRoutes, {
  prefix: 'user'
})
app.register(mealsRoutes, {
  prefix: 'meals'
})
app.get('/hello', async () => {
  return 'Olá mundo'
})