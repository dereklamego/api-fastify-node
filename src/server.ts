import fastify from "fastify";
import { app } from "./app";

app
  .listen({
    port: 3333
  })
  .then(() => {
    console.warn('Http Server Running')
  })


