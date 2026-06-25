import { env } from './data/env'
import { app } from './server'

app.onStart((ctx) => {
})

app.listen(env.PORT)