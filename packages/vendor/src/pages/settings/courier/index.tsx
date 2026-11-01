import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Switch, StatusBadge, Button, Container, Heading, Input, Label, Select, Text, toast, usePrompt } from "@medusajs/ui"
import { Plus, Trash } from "@medusajs/icons"
import { useCan } from "@mercurjs/dashboard-shared"

import { SingleColumnPage } from "@components/layout/pages"
import {
  useCourierAccounts,
  useCreateCourierAccount,
  useDeleteCourierAccount,
  useUpdateCourierAccount,
} from "@hooks/api/courier"

type Provider = "pathao" | "steadfast"

const emptyPathao = {
  client_id: "",
  client_secret: "",
  username: "",
  password: "",
  store_id: "",
}

const emptySteadfast = {
  apiKey: "",
  secretKey: "",
}

const CourierSettings = () => {
  const { t } = useTranslation()
  const prompt = usePrompt()
  const canEdit = useCan("courier_accounts")

  const { courier_accounts, isLoading, refetch } = useCourierAccounts()
  const createAccount = useCreateCourierAccount()
  const updateAccount = useUpdateCourierAccount()
  const deleteAccount = useDeleteCourierAccount()

  const [provider, setProvider] = useState<Provider>("pathao")
  const [pathao, setPathao] = useState(emptyPathao)
  const [steadfast, setSteadfast] = useState(emptySteadfast)

  const accounts = courier_accounts ?? []

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const data =
        provider === "pathao"
          ? {
              client_id: pathao.client_id.trim(),
              client_secret: pathao.client_secret.trim(),
              username: pathao.username.trim(),
              password: pathao.password,
              ...(pathao.store_id.trim()
                ? { store_id: Number(pathao.store_id.trim()) }
                : {}),
            }
          : {
              apiKey: steadfast.apiKey.trim(),
              secretKey: steadfast.secretKey.trim(),
            }

      await createAccount.mutateAsync({
        provider,
        data,
      } as any)

      toast.success(
        t("courier.toastConnected", {
          provider:
            provider === "pathao"
              ? t("courier.pathao")
              : t("courier.steadfast"),
        })
      )
      setPathao(emptyPathao)
      setSteadfast(emptySteadfast)
      refetch()
    } catch (error: any) {
      toast.error(error?.message ?? t("courier.toastConnectFailed"))
    }
  }

  const handleToggleCod = async (id: string, enabled: boolean) => {
    try {
      await updateAccount.mutateAsync({ $id: id, cod_enabled: enabled })
      toast.success(t("courier.toastCodUpdated"))
    } catch (error: any) {
      toast.error(error?.message ?? "Failed")
    }
  }

  const handleDisconnect = async (id: string) => {
    const confirmed = await prompt({
      title: t("general.areYouSure"),
      description: t("courier.disconnectConfirm"),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
      variant: "danger",
    })
    if (!confirmed) return

    try {
      await deleteAccount.mutateAsync({ id })
      toast.success(t("courier.toastDisconnected"))
      refetch()
    } catch (error: any) {
      toast.error(error?.message ?? "Failed")
    }
  }

  return (
    <SingleColumnPage showMetadata={false} showJSON={false}>
      <Container className="divide-y p-0" data-testid="courier-settings-page">
        <div className="px-6 py-4">
          <Heading level="h2">{t("courier.domain")}</Heading>
          <Text size="small" className="text-ui-fg-subtle mt-1">
            {t("courier.hint")}
          </Text>
        </div>

        <div className="px-6 py-4">
          <Heading level="h3" className="mb-3">
            {t("courier.accountsHeader")}
          </Heading>
          {isLoading ? (
            <Text size="small">{t("general.loading")}</Text>
          ) : accounts.length === 0 ? (
            <Text size="small" className="text-ui-fg-subtle">
              {t("courier.empty")}
            </Text>
          ) : (
            <ul className="flex flex-col gap-y-3" data-testid="courier-accounts-list">
              {accounts.map((account: any) => (
                <li
                  key={account.id}
                  className="bg-ui-bg-subtle flex flex-col gap-y-2 rounded-md px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  data-testid={`courier-account-${account.provider}`}
                >
                  <div className="flex items-center gap-x-3">
                    <Text size="small" weight="plus">
                      {account.provider === "pathao"
                        ? t("courier.pathao")
                        : t("courier.steadfast")}
                    </Text>
                    <StatusBadge
                      color={
                        account.status === "active" ? "green" : "red"
                      }
                    >
                      {account.status}
                    </StatusBadge>
                  </div>
                  <div className="flex items-center gap-x-4">
                    <Label className="flex items-center gap-x-2">
                      <Switch
                        checked={account.cod_enabled}
                        disabled={!canEdit}
                        onCheckedChange={(checked) =>
                          handleToggleCod(account.id, checked)
                        }
                        data-testid="courier-cod-switch"
                      />
                      <Text size="small">{t("courier.codEnabled")}</Text>
                    </Label>
                    {canEdit && (
                      <Button
                        variant="danger"
                        size="small"
                        onClick={() => handleDisconnect(account.id)}
                        data-testid="courier-disconnect-button"
                      >
                        <Trash />
                        {t("courier.disconnect")}
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {canEdit && (
          <form
            className="flex flex-col gap-y-4 px-6 py-4"
            onSubmit={handleConnect}
            data-testid="courier-connect-form"
          >
            <Heading level="h3">{t("courier.connectHeader")}</Heading>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-y-2">
                <Label>{t("courier.provider")}</Label>
                <Select
                  value={provider}
                  onValueChange={(value) => setProvider(value as Provider)}
                >
                  <Select.Trigger>
                    <Select.Value />
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value="pathao">{t("courier.pathao")}</Select.Item>
                    <Select.Item value="steadfast">
                      {t("courier.steadfast")}
                    </Select.Item>
                  </Select.Content>
                </Select>
              </div>

              {provider === "pathao" ? (
                <>
                  <div className="flex flex-col gap-y-2">
                    <Label>{t("courier.clientId")}</Label>
                    <Input
                      value={pathao.client_id}
                      onChange={(e) =>
                        setPathao({ ...pathao, client_id: e.target.value })
                      }
                      data-testid="pathao-client-id"
                    />
                  </div>
                  <div className="flex flex-col gap-y-2">
                    <Label>{t("courier.clientSecret")}</Label>
                    <Input
                      type="password"
                      value={pathao.client_secret}
                      onChange={(e) =>
                        setPathao({ ...pathao, client_secret: e.target.value })
                      }
                      data-testid="pathao-client-secret"
                    />
                  </div>
                  <div className="flex flex-col gap-y-2">
                    <Label>{t("courier.username")}</Label>
                    <Input
                      type="email"
                      value={pathao.username}
                      onChange={(e) =>
                        setPathao({ ...pathao, username: e.target.value })
                      }
                      data-testid="pathao-username"
                    />
                  </div>
                  <div className="flex flex-col gap-y-2">
                    <Label>{t("courier.password")}</Label>
                    <Input
                      type="password"
                      value={pathao.password}
                      onChange={(e) =>
                        setPathao({ ...pathao, password: e.target.value })
                      }
                      data-testid="pathao-password"
                    />
                  </div>
                  <div className="flex flex-col gap-y-2">
                    <Label optional>{t("courier.storeId")}</Label>
                    <Input
                      type="number"
                      value={pathao.store_id}
                      onChange={(e) =>
                        setPathao({ ...pathao, store_id: e.target.value })
                      }
                      data-testid="pathao-store-id"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-col gap-y-2">
                    <Label>{t("courier.apiKey")}</Label>
                    <Input
                      value={steadfast.apiKey}
                      onChange={(e) =>
                        setSteadfast({ ...steadfast, apiKey: e.target.value })
                      }
                      data-testid="steadfast-api-key"
                    />
                  </div>
                  <div className="flex flex-col gap-y-2">
                    <Label>{t("courier.secretKey")}</Label>
                    <Input
                      type="password"
                      value={steadfast.secretKey}
                      onChange={(e) =>
                        setSteadfast({
                          ...steadfast,
                          secretKey: e.target.value,
                        })
                      }
                      data-testid="steadfast-secret-key"
                    />
                  </div>
                </>
              )}
            </div>
            <div>
              <Button
                type="submit"
                isLoading={createAccount.isPending}
                data-testid="courier-connect-button"
              >
                <Plus />
                {t("courier.connect")}
              </Button>
            </div>
          </form>
        )}
      </Container>
    </SingleColumnPage>
  )
}

export const Component = CourierSettings
