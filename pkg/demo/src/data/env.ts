import { validateEnv, t } from 'rift/env'

export const env = validateEnv(Bun.env,
  t.Object({
    DATABASE_URL: t.String(),
    PORT: t.Number()
  }))
