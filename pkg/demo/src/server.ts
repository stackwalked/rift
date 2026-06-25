import { logger } from "@bogeychan/elysia-logger";
import { Elysia } from "elysia";
import { env } from "./data/env";
import { cors } from "@elysia/cors";
import { helmet } from "elysia-helmet";

const app = new Elysia({ aot: true, precompile: true })
  .use(logger())
  .use(cors())
  .use(helmet())
  .decorate('env', env)

type API = typeof app

export { app, type API }
