import { convertToLocale } from "@/lib/helpers/money";
import { getRegion } from "@/lib/data/regions";

type AnnouncementConfig = {
  enabled: boolean;
  message: string;
  amount: number | null;
  link_label: string | null;
  link_href: string | null;
  starts_at: string | null;
  ends_at: string | null;
};

type AnnouncementBarProps = {
  locale: string;
  announcement: AnnouncementConfig;
};

export const AnnouncementBar = async ({
  locale,
  announcement,
}: AnnouncementBarProps) => {
  const region = await getRegion(locale);
  const currencyCode = region?.currency_code ?? "bdt";

  const formattedAmount = announcement.amount
    ? convertToLocale({ amount: announcement.amount, currency_code: currencyCode })
    : "";

  const isInSchedule =
    (!announcement.starts_at || new Date() >= new Date(announcement.starts_at)) &&
    (!announcement.ends_at || new Date() <= new Date(announcement.ends_at));

  if (!announcement.enabled || !isInSchedule) {
    return null;
  }

  const linkPart = announcement.link_href
    ? (
      <a
        href={announcement.link_href}
        className="underline text-white hover:text-white/90"
        target="_blank"
        rel="noopener noreferrer"
      >
        {announcement.link_label ?? "Shop Now"}
      </a>
    )
    : null;

  return (
    <div
      className="bg-[rgb(var(--brand-500))] text-white h-7 flex items-center justify-center lg:px-4 px-0.5"
      data-testid="announcement-bar"
    >
      <p className="lg:text-xs text-[8px] font-medium">
        {announcement.message} {formattedAmount}{linkPart}
      </p>
    </div>
  )
}