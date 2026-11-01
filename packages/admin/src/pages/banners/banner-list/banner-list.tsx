import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { Badge, Button, Container, Heading, Select, Table, Text, toast } from "@medusajs/ui"
import { Plus, Trash, PencilSquare } from "@medusajs/icons"

import { SingleColumnPage } from "../../../components/layout/pages"
import { useHeroBanners } from "../../../hooks/api/hero-banners"
import { sdk } from "../../../lib/client"

export const BannerListPage = () => {
  const { t } = useTranslation()
  const { hero_banners, isLoading, isError, error, refetch } = useHeroBanners({ order: "rank" })
  const [slotFilter, setSlotFilter] = useState<string>("all")

  if (isError) throw error

  const slotLabel = (slot?: string) =>
    slot === "shop_collection"
      ? t("marketplace.banners.slotShopCollection")
      : slot === "company_1"
        ? t("marketplace.banners.slotCompany1")
        : slot === "company_2"
          ? t("marketplace.banners.slotCompany2")
          : slot === "offer_price"
            ? t("marketplace.banners.slotOffer")
            : t("marketplace.banners.slotHero")

  const visibleBanners = (hero_banners ?? []).filter(
    (b: any) => slotFilter === "all" || (b.slot ?? "hero") === slotFilter
  )

  const handleDelete = async (id: string) => {
    try {
      await sdk.admin.hero_banners.$id.delete({ $id: id })
      toast.success(t("marketplace.banners.toast_delete"))
      refetch()
    } catch (e: any) {
      toast.error(e?.message ?? "Failed")
    }
  }

  return (
    <SingleColumnPage data-testid="hero-banners-page">
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between gap-4 px-6 py-4">
          <Heading level="h2">{t("marketplace.banners.header")}</Heading>
          <div className="flex items-center gap-2">
            <Select value={slotFilter} onValueChange={setSlotFilter}>
              <Select.Trigger className="w-[220px]" data-testid="banners-slot-filter">
                <Select.Value />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="all">{t("marketplace.banners.slotAll")}</Select.Item>
                <Select.Item value="hero">{t("marketplace.banners.slotHero")}</Select.Item>
                <Select.Item value="shop_collection">{t("marketplace.banners.slotShopCollection")}</Select.Item>
                <Select.Item value="company_1">{t("marketplace.banners.slotCompany1")}</Select.Item>
                <Select.Item value="company_2">{t("marketplace.banners.slotCompany2")}</Select.Item>
                <Select.Item value="offer_price">{t("marketplace.banners.slotOffer")}</Select.Item>
              </Select.Content>
            </Select>
            <Button size="small" asChild>
              <Link to="/banners/create">
                <Plus /> {t("marketplace.banners.create")}
              </Link>
            </Button>
          </div>
        </div>
        {isLoading ? (
          <div className="p-6"><Text>{t("general.loading")}</Text></div>
        ) : (hero_banners ?? []).length === 0 ? (
          <div className="p-6"><Text>{t("marketplace.banners.empty")}</Text></div>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>{t("marketplace.banners.image")}</Table.HeaderCell>
                <Table.HeaderCell>{t("marketplace.banners.title")}</Table.HeaderCell>
                <Table.HeaderCell>{t("marketplace.banners.slot")}</Table.HeaderCell>
                <Table.HeaderCell>{t("marketplace.banners.ctaLink")}</Table.HeaderCell>
                <Table.HeaderCell>{t("marketplace.banners.rank")}</Table.HeaderCell>
                <Table.HeaderCell>{t("marketplace.banners.isActive")}</Table.HeaderCell>
                <Table.HeaderCell />
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {visibleBanners.map((b: any) => (
                <Table.Row key={b.id}>
                  <Table.Cell>
                    {b.image_url && <img src={b.image_url} alt={b.title} className="h-10 w-16 object-cover rounded" />}
                  </Table.Cell>
                  <Table.Cell>{b.title}</Table.Cell>
                  <Table.Cell>
                    <Badge size="2xsmall" color={b.slot && b.slot !== "hero" ? "blue" : "grey"}>
                      {slotLabel(b.slot)}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>{b.cta_link ?? "—"}</Table.Cell>
                  <Table.Cell>{b.rank}</Table.Cell>
                  <Table.Cell>{b.is_active ? "Yes" : "No"}</Table.Cell>
                  <Table.Cell>
                    <div className="flex gap-2">
                      <Button size="small" variant="secondary" asChild>
                        <Link to={`/banners/${b.id}/edit`}>
                          <PencilSquare />
                        </Link>
                      </Button>
                      <Button size="small" variant="danger" onClick={() => handleDelete(b.id)}>
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

export const Component = BannerListPage
