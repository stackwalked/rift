import Elysia from "elysia";

export function errors(): Elysia {
  return new Elysia()
    .onError(({  }) => {
      
    })
}