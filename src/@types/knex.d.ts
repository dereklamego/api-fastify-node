import { knex } from 'knex'

declare module 'knex/types/tables' {
  export interface Tables {
    meals: {
      id: string
      user_id: string
      session_id: string
      name: string
      description: string
      created_at: string
      updated_at: string
      is_on_diet: boolean
      date: number
    }

    user: {
      id: string
      session_id: string
      name: string
      email: string
      created_at: string
      updated_at: string
    }
  }
}


