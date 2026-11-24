import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import {
  Button,
  Container,
  Heading,
  Input,
  Label,
  Select,
  Switch,
  Text,
  Textarea,
  toast,
} from "@medusajs/ui"
import { usePermissionGate } from "@mercurjs/dashboard-shared"
import {
  AI_TASKS,
  type AiTask,
  type AiTaskModels,
} from "@mercurjs/types"

import {
  useChatbotSettings,
  useTestChatbot,
  useUpdateChatbotSettings,
} from "../../../hooks/api/chatbot"

type TaskModelForm = {
  provider: "openrouter" | "gemini" | "openai_compatible"
  base_url: string
  api_key: string
  model: string
  temperature: string
  max_tokens: string
}

const emptyTaskModelForm = (): TaskModelForm => ({
  provider: "openrouter",
  base_url: "",
  api_key: "",
  model: "",
  temperature: "",
  max_tokens: "",
})

type FormState = {
  enabled: boolean
  provider: "openrouter" | "gemini" | "openai_compatible"
  base_url: string
  model: string
  api_key: string
  stt_provider: "openai" | "gemini" | "none"
  stt_model: string
  stt_api_key: string
  system_prompt: string
  temperature: string
  max_tokens: string
  task_models: Record<AiTask, TaskModelForm>
}

const TASK_MODEL_LABELS: Record<AiTask, { title: string; description: string }> = {
  admin_text: {
    title: "Admin panel model",
    description: "Product drafts, tag/SEO suggestions, blog drafts and chat follow-ups.",
  },
  vendor_text: {
    title: "Seller panel model",
    description: "Product drafts created from the seller panel.",
  },
  vision: {
    title: "Image / vision model",
    description: "Any AI task that receives product photos. Must be vision-capable.",
  },
}

const defaultForm = (): FormState => ({
  enabled: false,
  provider: "openrouter",
  base_url: "",
  model: "",
  api_key: "",
  stt_provider: "none",
  stt_model: "",
  stt_api_key: "",
  system_prompt: "",
  temperature: "0.4",
  max_tokens: "1024",
  task_models: {
    admin_text: emptyTaskModelForm(),
    vendor_text: emptyTaskModelForm(),
    vision: emptyTaskModelForm(),
  },
})

export const ChatbotPage = () => {
  const { t } = useTranslation()
  const { allowed } = usePermissionGate("chatbot:edit")
  const { data, isPending, isError, error } = useChatbotSettings()
  const update = useUpdateChatbotSettings()
  const test = useTestChatbot()

  const [form, setForm] = useState<FormState>(defaultForm)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (!data?.settings) return
    const s = data.settings
    setForm({
      enabled: s.enabled,
      provider: s.provider,
      base_url: s.base_url ?? "",
      model: s.model ?? "",
      api_key: "",
      stt_provider: s.stt_provider,
      stt_model: s.stt_model ?? "",
      stt_api_key: "",
      system_prompt: s.system_prompt ?? "",
      temperature: String(s.temperature ?? 0.4),
      max_tokens: String(s.max_tokens ?? 1024),
      task_models: AI_TASKS.reduce(
        (acc, task) => {
          const slot = s.task_models?.[task]
          acc[task] = {
            provider: slot?.provider ?? s.provider,
            base_url: slot?.base_url ?? "",
            api_key: "",
            model: slot?.model ?? "",
            temperature:
              slot?.temperature != null
                ? String(slot.temperature)
                : String(s.temperature ?? 0.4),
            max_tokens:
              slot?.max_tokens != null
                ? String(slot.max_tokens)
                : String(s.max_tokens ?? 1024),
          }
          return acc
        },
        {} as Record<AiTask, TaskModelForm>
      ),
    })
    setDirty(false)
  }, [data])

  const patch = (partial: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...partial }))
    setDirty(true)
  }

  if (isPending) {
    return (
      <Container className="p-6">
        <Text className="text-ui-fg-subtle">{t("actions.loading", "Loading…")}</Text>
      </Container>
    )
  }

  // Don't crash the whole settings tree on a transient API error — show a
  // retryable panel instead (a mid-rebuild 500 used to blank the page).
  if (isError || !data?.settings) {
    const message =
      (error as Error | undefined)?.message ||
      t("general.unknownError", "An unknown error occurred")
    return (
      <Container className="divide-y p-0" data-testid="chatbot-settings-error">
        <div className="px-6 py-4">
          <Heading level="h2">{t("chatbot.domain", "AI Chatbot")}</Heading>
          <Text className="text-ui-fg-subtle" size="small">
            {t(
              "chatbot.load_failed",
              "Could not load chatbot settings. Check that the API is running, then retry."
            )}
          </Text>
        </div>
        <div className="flex items-center justify-between gap-4 px-6 py-4">
          <Text size="small" className="text-ui-fg-error" data-testid="chatbot-settings-error-message">
            {message}
          </Text>
          <Button
            variant="secondary"
            size="small"
            onClick={() => window.location.reload()}
            data-testid="chatbot-settings-retry"
          >
            {t("actions.retry", "Retry")}
          </Button>
        </div>
      </Container>
    )
  }

  const settings = data?.settings

  const handleSave = async () => {
    try {
      await update.mutateAsync({
        enabled: form.enabled,
        provider: form.provider,
        base_url: form.base_url.trim() || null,
        model: form.model.trim() || null,
        ...(form.api_key.trim()
          ? { api_key: form.api_key.trim() }
          : {}),
        stt_provider: form.stt_provider,
        stt_model: form.stt_model.trim() || null,
        ...(form.stt_api_key.trim()
          ? { stt_api_key: form.stt_api_key.trim() }
          : {}),
        system_prompt: form.system_prompt.trim() || null,
        temperature: Number(form.temperature) || 0.4,
        max_tokens: Number(form.max_tokens) || 1024,
        task_models: AI_TASKS.reduce((acc, task) => {
          const slot = form.task_models[task]
          acc[task] = {
            provider: slot.provider,
            base_url: slot.base_url.trim() || null,
            model: slot.model.trim() || null,
            temperature: Number(slot.temperature) || 0.4,
            max_tokens: Number(slot.max_tokens) || 1024,
            ...(slot.api_key.trim() ? { api_key: slot.api_key.trim() } : {}),
          }
          return acc
        }, {} as AiTaskModels),
      })
      setDirty(false)
      setForm((prev) => ({ ...prev, api_key: "", stt_api_key: "" }))
      toast.success(t("chatbot.toast_saved", "Chatbot settings saved"))
    } catch (err) {
      toast.error((err as Error).message || "Failed to save")
    }
  }

  const handleTest = async () => {
    try {
      const result = await test.mutateAsync(
        form.api_key.trim()
          ? {
              provider: form.provider,
              base_url: form.base_url.trim() || null,
              api_key: form.api_key.trim(),
              model: form.model.trim() || undefined,
            }
          : undefined
      )
      if (result.ok) {
        toast.success(
          t("chatbot.toast_test_ok", "Connection OK ({{ms}}ms)", {
            ms: result.latency_ms,
          })
        )
      } else {
        toast.error(result.error || "Connection failed")
      }
    } catch (err) {
      toast.error((err as Error).message || "Test failed")
    }
  }

  const handleTestTask = async (task: AiTask) => {
    const slot = form.task_models[task]
    try {
      const result = await test.mutateAsync({
        task,
        ...(slot.api_key.trim() ? { api_key: slot.api_key.trim() } : {}),
        ...(slot.model.trim() ? { model: slot.model.trim() } : {}),
        ...(slot.base_url.trim() ? { base_url: slot.base_url.trim() } : {}),
      })
      if (result.ok) {
        toast.success(
          t("chatbot.toast_test_ok", "Connection OK ({{ms}}ms)", {
            ms: result.latency_ms,
          })
        )
      } else {
        toast.error(result.error || "Connection failed")
      }
    } catch (err) {
      toast.error((err as Error).message || "Test failed")
    }
  }

  const updateTaskModel = (task: AiTask, partial: Partial<TaskModelForm>) => {
    setForm((prev) => ({
      ...prev,
      task_models: {
        ...prev.task_models,
        [task]: { ...prev.task_models[task], ...partial },
      },
    }))
    setDirty(true)
  }

  return (
    <Container className="divide-y p-0" data-testid="chatbot-settings-page">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2" data-testid="chatbot-settings-heading">
            {t("chatbot.domain", "AI Chatbot")}
          </Heading>
          <Text className="text-ui-fg-subtle" size="small">
            {t(
              "chatbot.subtitle",
              "Configure the storefront assistant: provider, model, voice, and system prompt."
            )}
          </Text>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="small"
            isLoading={test.isPending}
            onClick={handleTest}
            disabled={!allowed}
            data-testid="chatbot-test"
          >
            {t("chatbot.test", "Test connection")}
          </Button>
          <Button
            size="small"
            isLoading={update.isPending}
            disabled={!allowed || !dirty}
            onClick={handleSave}
            data-testid="chatbot-save"
          >
            {t("actions.save", "Save")}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 px-6 py-4 md:grid-cols-2">
        <div className="flex items-center justify-between rounded-lg border border-ui-border-base p-4">
          <div>
            <Label>{t("chatbot.enabled", "Enable assistant")}</Label>
            <Text size="small" className="text-ui-fg-subtle">
              {t("chatbot.enabled_hint", "Show the floating chat widget on the storefront")}
            </Text>
          </div>
          <Switch
            checked={form.enabled}
            disabled={!allowed}
            onCheckedChange={(v) => patch({ enabled: v })}
            data-testid="chatbot-enabled"
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-ui-border-base p-4">
          <div>
            <Label>{t("chatbot.api_key_set", "API key")}</Label>
            <Text size="small" className="text-ui-fg-subtle">
              {settings?.api_key_set
                ? t("chatbot.api_key_saved", "Saved (leave blank to keep)")
                : t("chatbot.api_key_missing", "Not set yet")}
            </Text>
          </div>
        </div>

        <div>
          <Label htmlFor="chatbot-provider">{t("chatbot.provider", "Provider")}</Label>
          <Select
            value={form.provider}
            disabled={!allowed}
            onValueChange={(v) =>
              patch({ provider: v as FormState["provider"] })
            }
          >
            <Select.Trigger id="chatbot-provider" data-testid="chatbot-provider">
              <Select.Value />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="openrouter">OpenRouter</Select.Item>
              <Select.Item value="gemini">Google Gemini</Select.Item>
              <Select.Item value="openai_compatible">
                OpenAI-compatible
              </Select.Item>
            </Select.Content>
          </Select>
        </div>

        <div>
          <Label htmlFor="chatbot-model">{t("chatbot.model", "Model")}</Label>
          <Input
            id="chatbot-model"
            value={form.model}
            disabled={!allowed}
            placeholder="e.g. openai/gpt-4o-mini or gemini-2.0-flash"
            onChange={(e) => patch({ model: e.target.value })}
            data-testid="chatbot-model"
          />
        </div>

        {form.provider === "openai_compatible" && (
          <div className="md:col-span-2">
            <Label htmlFor="chatbot-base-url">
              {t("chatbot.base_url", "Base URL")}
            </Label>
            <Input
              id="chatbot-base-url"
              value={form.base_url}
              disabled={!allowed}
              placeholder="https://api.openai.com/v1"
              onChange={(e) => patch({ base_url: e.target.value })}
              data-testid="chatbot-base-url"
            />
          </div>
        )}

        <div>
          <Label htmlFor="chatbot-api-key">
            {t("chatbot.api_key", "API key")}
          </Label>
          <Input
            id="chatbot-api-key"
            type="password"
            value={form.api_key}
            disabled={!allowed}
            placeholder={settings?.api_key_set ? "••••••••" : "sk-…"}
            onChange={(e) => patch({ api_key: e.target.value })}
            data-testid="chatbot-api-key"
          />
        </div>

        <div>
          <Label htmlFor="chatbot-temperature">
            {t("chatbot.temperature", "Temperature")}
          </Label>
          <Input
            id="chatbot-temperature"
            type="number"
            min={0}
            max={2}
            step={0.1}
            value={form.temperature}
            disabled={!allowed}
            onChange={(e) => patch({ temperature: e.target.value })}
            data-testid="chatbot-temperature"
          />
        </div>

        <div>
          <Label htmlFor="chatbot-max-tokens">
            {t("chatbot.max_tokens", "Max tokens")}
          </Label>
          <Input
            id="chatbot-max-tokens"
            type="number"
            min={64}
            max={8192}
            value={form.max_tokens}
            disabled={!allowed}
            onChange={(e) => patch({ max_tokens: e.target.value })}
            data-testid="chatbot-max-tokens"
          />
        </div>

        <div>
          <Label htmlFor="chatbot-stt">
            {t("chatbot.stt_provider", "Voice (STT) provider")}
          </Label>
          <Select
            value={form.stt_provider}
            disabled={!allowed}
            onValueChange={(v) =>
              patch({ stt_provider: v as FormState["stt_provider"] })
            }
          >
            <Select.Trigger id="chatbot-stt" data-testid="chatbot-stt-provider">
              <Select.Value />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="none">Disabled</Select.Item>
              <Select.Item value="openai">OpenAI Whisper</Select.Item>
              <Select.Item value="gemini">Gemini audio</Select.Item>
            </Select.Content>
          </Select>
        </div>

        {form.stt_provider !== "none" && (
          <>
            <div>
              <Label htmlFor="chatbot-stt-model">
                {t("chatbot.stt_model", "STT model")}
              </Label>
              <Input
                id="chatbot-stt-model"
                value={form.stt_model}
                disabled={!allowed}
                placeholder="whisper-1"
                onChange={(e) => patch({ stt_model: e.target.value })}
                data-testid="chatbot-stt-model"
              />
            </div>
            <div>
              <Label htmlFor="chatbot-stt-key">
                {t("chatbot.stt_api_key", "STT API key")}
              </Label>
              <Input
                id="chatbot-stt-key"
                type="password"
                value={form.stt_api_key}
                disabled={!allowed}
                placeholder={
                  settings?.stt_api_key_set ? "••••••••" : "optional"
                }
                onChange={(e) => patch({ stt_api_key: e.target.value })}
                data-testid="chatbot-stt-api-key"
              />
            </div>
          </>
        )}

        <div className="md:col-span-2">
          <Label htmlFor="chatbot-prompt">
            {t("chatbot.system_prompt", "System prompt")}
          </Label>
          <Textarea
            id="chatbot-prompt"
            rows={6}
            value={form.system_prompt}
            disabled={!allowed}
            placeholder={t(
              "chatbot.system_prompt_placeholder",
              "Leave blank to use the default Bangla+English shopping assistant prompt."
            )}
            onChange={(e) => patch({ system_prompt: e.target.value })}
            data-testid="chatbot-system-prompt"
          />
        </div>
      </div>

      <div className="flex flex-col gap-y-4 px-6 py-4" data-testid="ai-task-models">
        <div>
          <Heading level="h3">{t("chatbot.task_models_header", "AI models by task")}</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            {t(
              "chatbot.task_models_hint",
              "Each model has its own provider, key and limits. Leave a field empty to use the global settings above."
            )}
          </Text>
        </div>

        {AI_TASKS.map((task) => {
          const slot = form.task_models[task]
          const slotSaved = settings?.task_models?.[task]
          return (
            <div
              key={task}
              className="flex flex-col gap-y-4 rounded-lg border border-ui-border-base p-4"
              data-testid={`ai-task-model-${task}`}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label>{TASK_MODEL_LABELS[task].title}</Label>
                  <Text size="small" className="text-ui-fg-subtle">
                    {TASK_MODEL_LABELS[task].description}
                  </Text>
                </div>
                <Button
                  variant="secondary"
                  size="small"
                  isLoading={test.isPending}
                  disabled={!allowed}
                  onClick={() => handleTestTask(task)}
                  data-testid={`ai-task-model-test-${task}`}
                >
                  {t("chatbot.test", "Test connection")}
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor={`task-${task}-provider`}>
                    {t("chatbot.provider", "Provider")}
                  </Label>
                  <Select
                    value={slot.provider}
                    disabled={!allowed}
                    onValueChange={(v) =>
                      updateTaskModel(task, {
                        provider: v as TaskModelForm["provider"],
                      })
                    }
                  >
                    <Select.Trigger
                      id={`task-${task}-provider`}
                      data-testid={`ai-task-model-provider-${task}`}
                    >
                      <Select.Value />
                    </Select.Trigger>
                    <Select.Content>
                      <Select.Item value="openrouter">OpenRouter</Select.Item>
                      <Select.Item value="gemini">Google Gemini</Select.Item>
                      <Select.Item value="openai_compatible">
                        OpenAI-compatible
                      </Select.Item>
                    </Select.Content>
                  </Select>
                </div>

                <div>
                  <Label htmlFor={`task-${task}-model`}>
                    {t("chatbot.model", "Model")}
                  </Label>
                  <Input
                    id={`task-${task}-model`}
                    value={slot.model}
                    disabled={!allowed}
                    placeholder="e.g. openai/gpt-4o-mini"
                    onChange={(e) =>
                      updateTaskModel(task, { model: e.target.value })
                    }
                    data-testid={`ai-task-model-model-${task}`}
                  />
                </div>

                {slot.provider === "openai_compatible" && (
                  <div className="md:col-span-2">
                    <Label htmlFor={`task-${task}-base-url`}>
                      {t("chatbot.base_url", "Base URL")}
                    </Label>
                    <Input
                      id={`task-${task}-base-url`}
                      value={slot.base_url}
                      disabled={!allowed}
                      placeholder="https://api.openai.com/v1"
                      onChange={(e) =>
                        updateTaskModel(task, { base_url: e.target.value })
                      }
                      data-testid={`ai-task-model-base-url-${task}`}
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor={`task-${task}-api-key`}>
                    {t("chatbot.api_key", "API key")}
                  </Label>
                  <Input
                    id={`task-${task}-api-key`}
                    type="password"
                    value={slot.api_key}
                    disabled={!allowed}
                    placeholder={
                      slotSaved?.api_key_set ? "••••••••" : "optional"
                    }
                    onChange={(e) =>
                      updateTaskModel(task, { api_key: e.target.value })
                    }
                    data-testid={`ai-task-model-api-key-${task}`}
                  />
                </div>

                <div>
                  <Label htmlFor={`task-${task}-temperature`}>
                    {t("chatbot.temperature", "Temperature")}
                  </Label>
                  <Input
                    id={`task-${task}-temperature`}
                    type="number"
                    min={0}
                    max={2}
                    step={0.1}
                    value={slot.temperature}
                    disabled={!allowed}
                    onChange={(e) =>
                      updateTaskModel(task, { temperature: e.target.value })
                    }
                    data-testid={`ai-task-model-temperature-${task}`}
                  />
                </div>

                <div>
                  <Label htmlFor={`task-${task}-max-tokens`}>
                    {t("chatbot.max_tokens", "Max tokens")}
                  </Label>
                  <Input
                    id={`task-${task}-max-tokens`}
                    type="number"
                    min={64}
                    max={8192}
                    value={slot.max_tokens}
                    disabled={!allowed}
                    onChange={(e) =>
                      updateTaskModel(task, { max_tokens: e.target.value })
                    }
                    data-testid={`ai-task-model-max-tokens-${task}`}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="px-6 py-4" data-testid="ai-tools-settings-note">
        <Heading level="h3">
          {t("chatbot.ai_tools_header", "AI product tools")}
        </Heading>
        <Text size="small" className="text-ui-fg-subtle">
          {t(
            "chatbot.ai_tools_hint",
            "Admin, seller and image-based AI tasks use the dedicated models above. The storefront assistant and voice transcription keep using the global settings."
          )}
        </Text>
        <Text size="xsmall" className="mt-2 text-ui-fg-subtle">
          {t(
            "chatbot.ai_tools_usage",
            "AI calls log their surface and token usage for cost monitoring."
          )}
        </Text>
      </div>
    </Container>
  )
}
