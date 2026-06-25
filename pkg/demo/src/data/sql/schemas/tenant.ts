import { pgTable } from 'drizzle-orm/pg-core'

export const tenant = pgTable('tenant', t => ({
  id: t.serial()
}))