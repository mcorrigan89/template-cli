import type { Logger } from './logger.ts'

export interface Ctx {
  logger: Logger
  currentUserId: string | null
}
