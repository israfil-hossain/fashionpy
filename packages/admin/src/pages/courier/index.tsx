import { useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Badge,
  Button,
  Container,
  Heading,
  Input,
  Label,
  Select,
  StatusBadge,
  Text,
  toast,
} from "@medusajs/ui"
import { Plus } from "@medusajs/icons"

import { SingleColumnPage } from "../../components/layout/pages"
import {
  useCourierAccounts,
  useUpsertPlatformCourierAccount,
} from "../../hooks/api/courier"

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

  const { courier_accounts, isLoading, platform_env } = useCourierAccounts()
  const upsert = useUpsertPlatformCourierAccount()

  const [provider, setProvider] = useState<Provider>("pathao")
  const [pathao, setPathao] = useState(emptyPathao)
  const [steadfast, setSteadfast] = useState(emptySteadfast)

  const accounts = courier_accounts ?? []

  const envStatus = (p: Provider) =>
    platform_env?.[p]
      ? t("courier.envConfigured")
      : t("courier.envMissing")

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

      await upsert.mutateAsync({ provider, data } as any)

      toast.success(
        t("courier.toastPlatformConnected", {
          provider:
            provider === "pathao"
              ? t("courier.pathao")
              : t("courier.steadfast"),
        })
      )
      setPathao(emptyPathao)
      setSteadfast(emptySteadfast)
    } catch (error: any) {
      toast.error(error?.message ?? t("courier.toastConnectFailed"))
    }
  }

  return (
    <SingleColumnPage data-testid="admin-courier-page">
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading level="h2">{t("courier.domain")}</Heading>
          <Text size="small" className="text-ui-fg-subtle mt-1">
            {t("courier.adminHint")}
          </Text>
        </div>

        <div className="px-6 py-4">
          <Heading level="h3" className="mb-3">
            {t("courier.platformHeader")}
          </Heading>
          <div className="mb-3 flex flex-col gap-y-1">
            <Text size="small" data-testid="courier-env-pathao">
              {t("courier.pathao")}: {envStatus("pathao")}
            </Text>
            <Text size="small" data-testid="courier-env-steadfast">
              {t("courier.steadfast")}: {envStatus("steadfast")}
            </Text>
          </div>
          <Text size="small" className="text-ui-fg-subtle">
            {t("courier.platformHint")}
          </Text>
        </div>

        <div className="px-6 py-4">
          <Heading level="h3" className="mb-3">
            {t("courier.connectedHeader")}
          </Heading>
          {isLoading ? (
            <Text size="small">{t("general.loading")}</Text>
          ) : accounts.length === 0 ? (
            <Text size="small" className="text-ui-fg-subtle">
              {t("courier.empty")}
            </Text>
          ) : (
            <ul className="flex flex-col gap-y-2" data-testid="courier-accounts-list">
              {accounts.map((account: any) => (
                <li
                  key={account.id}
                  className="bg-ui-bg-subtle flex flex-col gap-y-1 rounded-md px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-x-3">
                    <Text size="small" weight="plus">
                      {account.provider === "pathao"
                        ? t("courier.pathao")
                        : t("courier.steadfast")}
                    </Text>
                    <StatusBadge
                      color={account.status === "active" ? "green" : "red"}
                    >
                      {account.status}
                    </StatusBadge>
                    {account.seller_id ? (
                      <Badge size="2xsmall" color="blue">
                        {account.seller_name ?? account.seller_id}
                      </Badge>
                    ) : (
                      <Badge size="2xsmall" color="green">
                        {t("courier.platformBadge")}
                      </Badge>
                    )}
                  </div>
                  <Text size="xsmall" className="text-ui-fg-subtle">
                    {account.cod_enabled
                      ? t("courier.codOn")
                      : t("courier.codOff")}
                  </Text>
                </li>
              ))}
            </ul>
          )}
        </div>

        <form
          className="flex flex-col gap-y-4 px-6 py-4"
          onSubmit={handleConnect}
          data-testid="courier-platform-form"
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
                    data-testid="admin-pathao-client-id"
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
                    data-testid="admin-steadfast-api-key"
                  />
                </div>
                <div className="flex flex-col gap-y-2">
                  <Label>{t("courier.secretKey")}</Label>
                  <Input
                    type="password"
                    value={steadfast.secretKey}
                    onChange={(e) =>
                      setSteadfast({ ...steadfast, secretKey: e.target.value })
                    }
                  />
                </div>
              </>
            )}
          </div>
          <div>
            <Button
              type="submit"
              isLoading={upsert.isPending}
              data-testid="courier-platform-connect-button"
            >
              <Plus />
              {t("courier.savePlatform")}
            </Button>
          </div>
        </form>
      </Container>
    </SingleColumnPage>
  )
}

export const Component = CourierSettings
export const CourierSettingsPage = CourierSettings
