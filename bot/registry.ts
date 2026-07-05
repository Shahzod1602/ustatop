import type { Api } from "grammy"

/**
 * Both bots run in one process. This registry lets one bot send messages to the
 * other's users — e.g. the Mijoz bot notifies matched masters (Usta bot users),
 * and the Usta bot notifies the customer (Mijoz bot user) when a job is accepted.
 */
export const bots: { ustaApi?: Api; mijozApi?: Api } = {}
