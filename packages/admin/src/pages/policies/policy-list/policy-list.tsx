import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import {
  Badge,
  Button,
  Container,
  Heading,
  Select,
  Table,
  Text,
  toast,
} from "@medusajs/ui"
import { Plus, Trash, PencilSquare } from "@medusajs/icons"

import { SingleColumnPage } from "../../../components/layout/pages"
import { usePolicies, useDeletePolicy } from "../../../hooks/api/policies"

export const PolicyListPage = () => {
  const { t } = useTranslation()
  const { policy_pages, isLoading, isError, error, refetch } = usePolicies({
    limit: 100,
  })
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const remove = useDeletePolicy()

  if (isError) throw error

  const visible = (policy_pages ?? []).filter(
    (p: any) => statusFilter === "all" || p.status === statusFilter
  )

  const handleDelete = async (id: string) => {
    try {
      await remove.mutateAsync(id)
      toast.success(t("marketplace.policies.toast_delete"))
      refetch()
    } catch (e: any) {
      toast.error(e?.message ?? "Failed")
    }
  }

  return (
    <SingleColumnPage data-testid="policy-list-page">
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between gap-4 px-6 py-4">
          <Heading level="h2">{t("marketplace.policies.header")}</Heading>
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <Select.Trigger
                className="w-[180px]"
                data-testid="policy-status-filter"
              >
                <Select.Value />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="all">
                  {t("marketplace.policies.statusAll")}
                </Select.Item>
                <Select.Item value="draft">
                  {t("marketplace.policies.statusDraft")}
                </Select.Item>
                <Select.Item value="published">
                  {t("marketplace.policies.statusPublished")}
                </Select.Item>
              </Select.Content>
            </Select>
            <Button size="small" asChild>
              <Link to="/policies/create">
                <Plus /> {t("marketplace.policies.create")}
              </Link>
            </Button>
          </div>
        </div>
        {isLoading ? (
          <div className="p-6">
            <Text>{t("general.loading")}</Text>
          </div>
        ) : visible.length === 0 ? (
          <div className="p-6">
            <Text>{t("marketplace.policies.empty")}</Text>
          </div>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>{t("marketplace.policies.title")}</Table.HeaderCell>
                <Table.HeaderCell>{t("marketplace.policies.slug")}</Table.HeaderCell>
                <Table.HeaderCell>
                  {t("marketplace.policies.status")}
                </Table.HeaderCell>
                <Table.HeaderCell>
                  {t("marketplace.policies.countries")}
                </Table.HeaderCell>
                <Table.HeaderCell>
                  {t("marketplace.policies.publishedAt")}
                </Table.HeaderCell>
                <Table.HeaderCell />
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {visible.map((p: any) => (
                <Table.Row key={p.id}>
                  <Table.Cell>{p.title}</Table.Cell>
                  <Table.Cell>
                    <Text className="text-ui-fg-subtle">/policies/{p.slug}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge
                      size="2xsmall"
                      color={p.status === "published" ? "green" : "grey"}
                    >
                      {p.status === "published"
                        ? t("marketplace.policies.statusPublished")
                        : t("marketplace.policies.statusDraft")}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    {!p.country_codes?.length
                      ? t("marketplace.policies.countriesAll")
                      : p.country_codes.map((c: string) => c.toUpperCase()).join(", ")}
                  </Table.Cell>
                  <Table.Cell>
                    {p.published_at
                      ? new Date(p.published_at).toLocaleDateString()
                      : "—"}
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex gap-2">
                      <Button size="small" variant="secondary" asChild>
                        <Link to={`/policies/${p.id}/edit`}>
                          <PencilSquare />
                        </Link>
                      </Button>
                      <Button
                        size="small"
                        variant="danger"
                        onClick={() => handleDelete(p.id)}
                      >
                        <Trash />
                      </Button>
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </Container>
    </SingleColumnPage>
  )
}

export const Component = PolicyListPage
