import { CHATBOT_MODULE } from "../index"
import { decryptSecret, encryptSecret } from "../crypto"
import {
  mergeTaskModelsForUpdate,
  parseStoredTaskModels,
  resolveTaskConfig,
  toTaskModelsDto,
} from "../task-models"
import { loadAiRuntime } from "../../../ai/runtime"

describe("per-task AI model config", () => {
  const row = {
    provider: "gemini",
    base_url: null,
    api_key_encrypted: encryptSecret("global-key"),
    model: "global-model",
    temperature: 0.4,
    max_tokens: 1024,
    task_models: {
      admin_text: {
        provider: "openrouter",
        model: "admin-model",
        api_key: encryptSecret("admin-key"),
      },
      vendor_text: {
        model: "vendor-model",
      },
      vision: {},
    },
  }

  it("returns the global model when no task is given", () => {
    expect(resolveTaskConfig(row)).toMatchObject({
      provider: "gemini",
      api_key: "global-key",
      model: "global-model",
      max_tokens: 1024,
    })
  })

  it("uses a task slot's provider, key and model but inherits missing fields", () => {
    expect(resolveTaskConfig(row, "admin_text")).toEqual({
      provider: "openrouter",
      base_url: null,
      api_key: "admin-key",
      model: "admin-model",
      temperature: 0.4,
      max_tokens: 1024,
    })
  })

  it("falls back field-by-field for a partial slot", () => {
    expect(resolveTaskConfig(row, "vendor_text")).toMatchObject({
      provider: "gemini",
      api_key: "global-key",
      model: "vendor-model",
    })
  })

  it("falls back completely for an empty slot", () => {
    expect(resolveTaskConfig(row, "vision")).toMatchObject({
      model: "global-model",
      api_key: "global-key",
    })
  })

  it("uses the panel model when the vision slot is empty", () => {
    expect(resolveTaskConfig(row, "vision", "vendor_text")).toMatchObject({
      model: "vendor-model",
      provider: "gemini",
    })
  })

  it("never exposes task API keys in the settings DTO", () => {
    const dto = toTaskModelsDto(parseStoredTaskModels(row.task_models))
    expect(dto.admin_text).toMatchObject({
      provider: "openrouter",
      model: "admin-model",
      api_key_set: true,
    })
    expect(dto.admin_text).not.toHaveProperty("api_key")
    expect(dto.vision.api_key_set).toBe(false)
  })

  it("encrypts a new slot key without touching the other slots", () => {
    const stored = parseStoredTaskModels(row.task_models)
    const merged = mergeTaskModelsForUpdate(stored, {
      vision: { model: "vision-model", api_key: "vision-key" },
    })

    expect(merged.admin_text.model).toBe("admin-model")
    expect(merged.vision.model).toBe("vision-model")
    expect(
      typeof merged.vision.api_key === "string"
        ? decryptSecret(merged.vision.api_key)
        : null
    ).toBe("vision-key")
  })

  it("routes loadAiRuntime to the requested task model", async () => {
    const getRuntimeSettings = jest.fn(async (task?: string) => ({
      ...resolveTaskConfig(row, task as never),
      enabled: true,
    }))
    const container = {
      resolve: jest.fn((key: string) =>
        key === CHATBOT_MODULE ? { getRuntimeSettings } : {}
      ),
    }

    const admin = await loadAiRuntime(container as never, "admin_text")
    const vendor = await loadAiRuntime(container as never, "vendor_text")
    const global = await loadAiRuntime(container as never)

    expect(admin.model).toBe("admin-model")
    expect(vendor.model).toBe("vendor-model")
    expect(global.model).toBe("global-model")
    expect(getRuntimeSettings).toHaveBeenCalledWith("admin_text", undefined)
  })
})
