'use client';

import { useEffect, useMemo, useState } from 'react';

import Image from 'next/image';

import { Button } from '@/components/atoms/Button/Button';
import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { useCartContext } from '@/components/providers';
import { useCartDrawer } from '@/components/providers/Cart/drawer';
import { CloseIcon } from '@/icons';
import { listOffers } from '@/lib/data/offers';
import {
  getBuyboxWinner,
  getOfferAmount,
  getOfferStock,
  getVariantOffers,
  rankOffers,
  type StoreOffer
} from '@/lib/helpers/buybox';
import { convertToLocale } from '@/lib/helpers/money';
import { toast } from '@/lib/helpers/toast';
import type { StudioRailItem } from '@/types/studio-rail';

const pad = (value: number) => String(value).padStart(2, '0');

const optionTitleOf = (option: { option?: { title?: string | null } | null } | null | undefined) =>
  (option?.option?.title || 'option').toLowerCase();

type OptionGroup = { key: string; title: string; values: string[] };

const buildOptionGroups = (item: StudioRailItem): OptionGroup[] => {
  const groups = new Map<string, OptionGroup>();

  for (const variant of item.variants ?? []) {
    for (const option of variant.options ?? []) {
      const key = optionTitleOf(option);
      const group = groups.get(key) ?? {
        key,
        title: option.option?.title || 'Option',
        values: []
      };
      if (option.value && !group.values.includes(option.value)) {
        group.values.push(option.value);
      }
      groups.set(key, group);
    }
  }

  return [...groups.values()].filter(group => group.values.length > 0);
};

/**
 * Quick view opened from a studio-rail garment: front/back gallery, option
 * pickers, and an offer-scoped add-to-cart (the marketplace sells through
 * offers, same flow as ProductBuyBox).
 */
export const StudioRailQuickView = ({
  item,
  index,
  total,
  locale,
  onClose
}: {
  item: StudioRailItem;
  index: number;
  total: number;
  locale: string;
  onClose: () => void;
}) => {
  const { addToCart, isAddingItem } = useCartContext();
  const { openDrawer } = useCartDrawer();

  const optionGroups = useMemo(() => buildOptionGroups(item), [item]);
  const firstVariant = item.variants?.[0];

  const [selectedValues, setSelectedValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const option of firstVariant?.options ?? []) {
      initial[optionTitleOf(option)] = option.value;
    }
    return initial;
  });
  const [view, setView] = useState<'front' | 'back'>('front');
  const [offers, setOffers] = useState<StoreOffer[] | null>(null);

  const selectedVariant =
    item.variants?.find(variant =>
      (variant.options ?? []).every(
        option => selectedValues[optionTitleOf(option)] === option.value
      )
    ) ?? firstVariant;
  const selectedVariantId = selectedVariant?.id;

  useEffect(() => {
    let cancelled = false;
    listOffers({ productId: item.id, countryCode: locale }).then(({ offers: fetched }) => {
      if (!cancelled) setOffers(fetched as StoreOffer[]);
    });
    return () => {
      cancelled = true;
    };
  }, [item.id, locale]);

  // Products can carry offers on only some variants — once offers arrive,
  // fall back to the best offered variant so the default selection is
  // purchasable (same buybox ordering as the product page).
  useEffect(() => {
    if (!offers?.length) return;

    const currentHasOffer =
      selectedVariantId !== undefined &&
      getVariantOffers(offers, selectedVariantId).length > 0;
    if (currentHasOffer) return;

    const bestOffer = rankOffers(offers)[0];
    const offeredVariant = item.variants?.find(
      variant => variant.id === bestOffer?.variant_id
    );
    if (!offeredVariant) return;

    const next: Record<string, string> = {};
    for (const option of offeredVariant.options ?? []) {
      next[optionTitleOf(option)] = option.value;
    }
    setSelectedValues(next);
  }, [offers, item.variants, selectedVariantId]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  const winner = selectedVariant
    ? getBuyboxWinner(getVariantOffers(offers ?? [], selectedVariant.id))
    : undefined;

  const winnerAmount = winner ? getOfferAmount(winner) : null;
  const displayPrice =
    winnerAmount !== null && winner
      ? convertToLocale({
          amount: winnerAmount,
          currency_code: winner.calculated_price?.currency_code || 'bdt'
        })
      : item.price;

  const stock = winner ? getOfferStock(winner) : 0;
  const offersLoaded = offers !== null;
  const canAdd = offersLoaded && Boolean(winner) && stock > 0;
  const buttonLabel = !offersLoaded
    ? 'ADD TO CART'
    : !winner
      ? 'NOT AVAILABLE'
      : stock > 0
        ? 'ADD TO CART'
        : 'OUT OF STOCK';

  const frontImage = item.frontImage ?? item.thumbnail;
  const backImage = item.backImage;
  const activeImage = view === 'back' && backImage ? backImage : frontImage;

  const handleAddToCart = async () => {
    if (!canAdd || !winner || !selectedVariant) return;

    const amount = winnerAmount ?? 0;
    const subtotal = winner.calculated_price?.calculated_amount_without_tax ?? amount;

    try {
      await addToCart({
        offerId: winner.id,
        quantity: 1,
        countryCode: locale,
        optimisticItem: {
          currencyCode: winner.calculated_price?.currency_code || 'bdt',
          item: {
            thumbnail: item.thumbnail || '',
            product_title: item.title,
            quantity: 1,
            subtotal,
            total: amount,
            tax_total: amount - subtotal,
            variant_id: selectedVariant.id,
            product_id: item.id,
            metadata: { offer_id: winner.id }
          }
        }
      });
      onClose();
      openDrawer();
    } catch {
      toast.error({
        title: 'Error adding to cart',
        description: 'This offer does not have the required inventory'
      });
    }
  };

  return (
    <div
      className="studio-qv"
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
      data-testid="studio-rail-quick-view"
      data-offers-state={offers === null ? 'loading' : `loaded-${offers.length}`}
    >
      <div className="studio-qv__backdrop" onClick={onClose} aria-hidden="true" />
      <div className="studio-qv__panel">
        <button
          type="button"
          className="studio-qv__close"
          onClick={onClose}
          data-testid="studio-rail-quick-view-close"
        >
          Close
          <CloseIcon size={14} />
        </button>

        <div className="studio-qv__media">
          <div className="studio-qv__glow" aria-hidden="true" />
          {activeImage && (
            <Image
              src={decodeURIComponent(activeImage)}
              alt={item.title}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="studio-qv__image"
              priority
            />
          )}
        </div>

        <div className="studio-qv__info">
          <p className="studio-qv__counter" data-testid="studio-rail-quick-view-counter">
            {pad(index + 1)} / {pad(total)}
          </p>
          <h3 className="studio-qv__title">{item.title}</h3>
          <p className="studio-qv__price" data-testid="studio-rail-quick-view-price">
            {displayPrice}
          </p>

          {backImage && (
            <div className="studio-qv__tabs" role="tablist" aria-label="Product views">
              <button
                type="button"
                role="tab"
                aria-selected={view === 'front'}
                className="studio-qv__tab"
                data-active={view === 'front' ? 'true' : undefined}
                onClick={() => setView('front')}
              >
                Front
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={view === 'back'}
                className="studio-qv__tab"
                data-active={view === 'back' ? 'true' : undefined}
                onClick={() => setView('back')}
              >
                Back
              </button>
            </div>
          )}

          {optionGroups.map(group => (
            <div key={group.key} className="studio-qv__option-group">
              <p className="studio-qv__option-label">{group.title.toUpperCase()}</p>
              <div
                className="studio-qv__option-list"
                role="radiogroup"
                aria-label={group.title}
              >
                {group.values.map(value => {
                  const isActive = selectedValues[group.key] === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={isActive}
                      className="studio-qv__option"
                      data-active={isActive ? 'true' : undefined}
                      onClick={() =>
                        setSelectedValues(previous => ({ ...previous, [group.key]: value }))
                      }
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <Button
            className="studio-qv__cta w-full justify-center rounded-full bg-black px-6 py-4 text-white hover:bg-neutral-800"
            size="large"
            onClick={handleAddToCart}
            disabled={!canAdd}
            loading={isAddingItem}
            data-testid="studio-rail-quick-view-add"
          >
            {buttonLabel}
          </Button>

          <div className="studio-qv__footer">
            <span className="studio-qv__footer-title">{item.title}</span>
            <LocalizedClientLink
              href={`/products/${item.handle}`}
              className="studio-qv__product-link"
              onClick={onClose}
              data-testid="studio-rail-quick-view-product-link"
            >
              View product page
            </LocalizedClientLink>
          </div>
        </div>
      </div>
    </div>
  );
};
