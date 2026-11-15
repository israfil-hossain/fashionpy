"use client";

import { useState } from "react";
import { toast } from "@/lib/helpers/toast";
import { CopyIcon, DoneIcon } from "@/icons";
import type { HomePromotion } from "@/lib/data/promotions";

const formatDiscount = (promotion: HomePromotion): string | null => {
  const method = promotion.application_method;
  if (!method || method.value === undefined || method.value === null) {
    return null;
  }

  if (method.type === "percentage") {
    return `${method.value}% OFF`;
  }

  if (method.type === "fixed") {
    const currency = (method.currency_code ?? "").toUpperCase();
    return currency ? `${method.value} ${currency} OFF` : `${method.value} OFF`;
  }

  return null;
};

const formatDate = (value: string): string => {
  try {
    return new Date(value).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
};

export const PromoCodeCard = ({ promotion }: { promotion: HomePromotion }) => {
  const [copied, setCopied] = useState(false);

  const discount = formatDiscount(promotion);
  const endsAt = promotion.campaign?.ends_at
    ? formatDate(promotion.campaign.ends_at)
    : null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(promotion.code);
      setCopied(true);
      toast.success({ title: "Code copied" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.info({ title: "Could not copy code" });
    }
  };

  return (
    <div
      className="flex min-w-[220px] flex-col gap-2 rounded-xl border border-dashed border-[rgb(var(--brand-500))] bg-[#FFF5F8] p-4"
      data-testid="promo-code-card"
      data-promo-code={promotion.code}
    >
      <div className="flex items-start justify-between gap-2">
        {discount && (
          <span className="text-lg font-extrabold leading-none text-[rgb(var(--brand-600))]">
            {discount}
          </span>
        )}
        {promotion.campaign?.name && (
          <span className="label-md truncate text-right text-xs text-gray-500">
            {promotion.campaign.name}
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={handleCopy}
        aria-label={`Copy promo code ${promotion.code}`}
        className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 shadow-sm transition-colors hover:bg-gray-50"
        data-testid="promo-code-copy-button"
      >
        <span className="font-mono text-sm font-bold tracking-wider text-primary">
          {promotion.code}
        </span>
        {copied ? (
          <DoneIcon color="rgb(20, 83, 45)" size={16} />
        ) : (
          <CopyIcon size={16} />
        )}
      </button>

      {endsAt && (
        <span className="text-[11px] text-gray-500">Ends {endsAt}</span>
      )}
    </div>
  );
};
