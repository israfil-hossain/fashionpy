import {
  AI_TASKS,
  type AiTask,
  type AiTaskModelConfig,
  type AiTaskModels,
  type AiTaskModelsDTO,
  emptyAiTaskModels,
  emptyAiTaskModelsDTO,
} from "@mercurjs/types"

import { encryptSecret, decryptSecret } from "./crypto"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

export const parseStoredTaskModels = (raw: unknown): AiTaskModels => {
  let parsed = raw
  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed)
    } catch {
      parsed = null
    }
  }

  const result = emptyAiTaskModels()
  if (!isRecord(parsed)) {
    return result
  }

  for (const task of AI_TASKS) {
    const slot = parsed[task]
    if (isRecord(slot)) {
      result[task] = slot as AiTaskModelConfig
    }
  }
  return result
}

export const toTaskModelsDto = (stored: AiTaskModels): AiTaskModelsDTO => {
  const dto = emptyAiTaskModelsDTO()
  for (const task of AI_TASKS) {
    const slot = stored[task] ?? {}
    const { api_key, ...rest } = slot
    dto[task] = {
      ...rest,
      api_key_set: !!(typeof api_key === "string" && decryptSecret(api_key)),
    }
  }
  return dto
}

export const mergeTaskModelsForUpdate = (
  existing: AiTaskModels,
  input: Partial<AiTaskModels> | undefined
): AiTaskModels => {
  if (!input) {
    return existing
  }

  const next = emptyAiTaskModels()
  for (const task of AI_TASKS) {
    const current = existing[task] ?? {}
    const update = input[task]
    if (!update) {
      next[task] = current
      continue
    }

    const merged: Record<string, unknown> = { ...current }
    for (const key of [
      "provider",
      "base_url",
      "model",
      "temperature",
      "max_tokens",
    ]) {
      if (update[key as keyof AiTaskModelConfig] !== undefined) {
        merged[key] = update[key as keyof AiTaskModelConfig]
      }
    }
    if (update.api_key !== undefined) {
      merged.api_key = update.api_key ? encryptSecret(update.api_key) : null
    }
    next[task] = merged as AiTaskModelConfig
  }
  return next
}

/**
 * Field-by-field fallback: a configured slot wins, anything missing comes from
 * the legacy global model. With no task, the global model is returned unchanged.
 */
export const resolveTaskConfig = (
  row: Record<string, unknown>,
  task?: AiTask,
  fallbackTask?: AiTask
) => {
  const global = {
    provider: (row.provider ?? "openrouter") as NonNullable<
      AiTaskModelConfig["provider"]
    >,
    base_url: (row.base_url as string | null) ?? null,
    api_key: row.api_key_encrypted
      ? decryptSecret(row.api_key_encrypted as string)
      : null,
    model: (row.model as string | null) ?? null,
    temperature: (row.temperature as number | undefined) ?? 0.4,
    max_tokens: (row.max_tokens as number | undefined) ?? 1024,
  }

  if (!task && !fallbackTask) {
    return global
  }

  const stored = parseStoredTaskModels(row.task_models)
  const applySlot = (
    current: typeof global,
    slot: AiTaskModelConfig | undefined
  ) => ({
    provider: slot?.provider ?? current.provider,
    base_url: slot?.base_url ?? current.base_url,
    api_key:
      typeof slot?.api_key === "string"
        ? (decryptSecret(slot.api_key) ?? current.api_key)
        : current.api_key,
    model: slot?.model ?? current.model,
    temperature: slot?.temperature ?? current.temperature,
    max_tokens: slot?.max_tokens ?? current.max_tokens,
  })

  let resolved = global
  if (fallbackTask) {
    resolved = applySlot(resolved, stored[fallbackTask])
  }
  if (task) {
    resolved = applySlot(resolved, stored[task])
  }
  return resolved
}
