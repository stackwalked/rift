import { env } from '@/data/env'
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/data/sql/schemas/*',
  out: './src/data/sql/migrations',
  dbCredentials: {
    url: env.DATABASE_URL
  }
})
