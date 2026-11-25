'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import useEmblaCarousel from 'embla-carousel-react';
import Image from 'next/image';

import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { ArrowLeftIcon, ArrowRightIcon } from '@/icons';
import type { StudioRailGroup, StudioRailItem } from '@/types/studio-rail';

import { StudioRailQuickView } from './StudioRailQuickView';

const RailItem = ({
  item,
  index,
  selected,
  onOpen
}: {
  item: StudioRailItem;
  index: number;
  selected: boolean;
  onOpen: (item: StudioRailItem, index: number) => void;
}) => {
  const style = {
    '--sway-delay': `${(index % 5) * -1.7}s`,
    '--sway-duration': `${7 + (index % 3) * 1.2}s`,
    '--sway-rest': `${index % 2 === 0 ? '-0.4deg' : '0.3deg'}`
  } as React.CSSProperties;

  const thumbnail = decodeURIComponent(item.thumbnail as string);
  const front = item.frontImage ? decodeURIComponent(item.frontImage) : null;
  const showFrontOnHover = Boolean(front && front !== thumbnail);

  return (
    <li
      className="studio-rail__slide"
      data-selected={selected ? 'true' : undefined}
      data-has-front={showFrontOnHover ? 'true' : undefined}
      style={style}
    >
      <LocalizedClientLink
        href={`/products/${item.handle}`}
        className="studio-rail__link"
        aria-label={`View ${item.title}`}
        onClick={event => {
          // Left click opens the quick view; modified/middle clicks keep the
          // native link behaviour (new tab, download, …).
          if (
            event.defaultPrevented ||
            event.button !== 0 ||
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey
          ) {
            return;
          }
          event.preventDefault();
          onOpen(item, index);
        }}
      >
        <div className="studio-rail__tilt">
          <div className="studio-rail__sway">
            <div className="studio-rail__garment">
              <Image
                src={thumbnail}
                alt={item.title}
                fill
                sizes="(min-width: 768px) 240px, 46vw"
                className="studio-rail__image studio-rail__image--back"
                priority={index < 6}
              />
              {showFrontOnHover && (
                <Image
                  src={front as string}
                  alt=""
                  aria-hidden="true"
                  fill
                  sizes="(min-width: 768px) 240px, 46vw"
                  className="studio-rail__image studio-rail__image--front"
                />
              )}
            </div>
          </div>
          <div
            className="studio-rail__shadow"
            aria-hidden="true"
          />
        </div>
        <div
          className="studio-rail__caption"
          data-selected={selected ? 'true' : undefined}
        >
          <p className="studio-rail__caption-title">{item.title}</p>
          {(item.price || item.originalPrice) && (
            <p className="studio-rail__caption-price">
              {item.price && <span>{item.price}</span>}
              {item.price && item.originalPrice && item.originalPrice !== item.price && (
                <s className="studio-rail__caption-original">{item.originalPrice}</s>
              )}
            </p>
          )}
          <span className="studio-rail__caption-cta">Shop now</span>
        </div>
      </LocalizedClientLink>
    </li>
  );
};

export const StudioRailClient = ({
  groups,
  activeKey,
  locale
}: {
  groups: StudioRailGroup[];
  activeKey?: string;
  locale: string;
}) => {
  const initialKey =
    activeKey && groups.some(group => group.key === activeKey) ? activeKey : groups[0].key;

  const [active, setActive] = useState(initialKey);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [quickView, setQuickView] = useState<{ item: StudioRailItem; index: number } | null>(
    null
  );
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'center',
    loop: true,
    dragFree: true,
    containScroll: false
  });

  const group = groups.find(candidate => candidate.key === active) ?? groups[0];

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());

    let lastProgress = emblaApi.scrollProgress();
    const onScroll = () => {
      const progress = emblaApi.scrollProgress();
      const delta = progress - lastProgress;
      lastProgress = progress;
      const tilt = Math.max(-4, Math.min(4, delta * 120));
      emblaApi.rootNode().style.setProperty('--rail-tilt', `${tilt.toFixed(2)}deg`);
    };
    const onSettle = () => {
      emblaApi.rootNode().style.setProperty('--rail-tilt', '0deg');
    };

    onSelect();
    emblaApi
      .on('select', onSelect)
      .on('reInit', onSelect)
      .on('scroll', onScroll)
      .on('settle', onSettle);

    return () => {
      emblaApi
        .off('select', onSelect)
        .off('reInit', onSelect)
        .off('scroll', onScroll)
        .off('settle', onSettle);
    };
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.scrollTo(0, true);
    setSelectedIndex(0);
    emblaApi.rootNode().style.setProperty('--rail-tilt', '0deg');
  }, [emblaApi, active]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const closeQuickView = useCallback(() => setQuickView(null), []);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        scrollPrev();
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        scrollNext();
      }
    },
    [scrollPrev, scrollNext]
  );

  return (
    <section
      className="studio-rail"
      aria-labelledby="studio-rail-heading"
    >
      <div className="studio-rail__header">
        <div className="studio-rail__intro">
          <h2
            id="studio-rail-heading"
            className="heading-lg uppercase"
          >
            Studio Rail
          </h2>
          <p className="studio-rail__subline">
            Fresh off the rack &mdash; curated looks, one rail at a time
          </p>
        </div>
        <div
          className="studio-rail__tabs"
          role="tablist"
          aria-label="Clothing categories"
        >
          {groups.map(candidate => {
            const isActive = candidate.key === active;
            return (
              <button
                key={candidate.key}
                type="button"
                role="tab"
                id={`studio-rail-tab-${candidate.key}`}
                aria-selected={isActive}
                aria-controls={`studio-rail-panel-${candidate.key}`}
                onClick={() => setActive(candidate.key)}
                className="studio-rail__tab"
                data-active={isActive ? 'true' : undefined}
              >
                {candidate.label}
              </button>
            );
          })}
        </div>
      </div>

      <div
        className="studio-rail__stage"
        role="tabpanel"
        id={`studio-rail-panel-${group.key}`}
        aria-labelledby={`studio-rail-tab-${group.key}`}
      >
        <div className="studio-rail__bar" aria-hidden="true" />
        <div
          className="studio-rail__viewport"
          ref={emblaRef}
          role="region"
          aria-roledescription="carousel"
          aria-label={`${group.label} studio rail`}
          tabIndex={0}
          onKeyDown={onKeyDown}
        >
          <ul className="embla__container studio-rail__track">
            {group.items.map((item, index) => (
              <RailItem
                key={item.id}
                item={item}
                index={index}
                selected={index === selectedIndex}
                onOpen={(openedItem, openedIndex) =>
                  setQuickView({ item: openedItem, index: openedIndex })
                }
              />
            ))}
          </ul>
        </div>

        <button
          type="button"
          className="studio-rail__arrow studio-rail__arrow--prev"
          onClick={scrollPrev}
          aria-label="Previous items"
        >
          <ArrowLeftIcon size={20} />
        </button>
        <button
          type="button"
          className="studio-rail__arrow studio-rail__arrow--next"
          onClick={scrollNext}
          aria-label="Next items"
        >
          <ArrowRightIcon size={20} />
        </button>
      </div>

      {quickView && (
        <StudioRailQuickView
          item={quickView.item}
          index={quickView.index}
          total={group.items.length}
          locale={locale}
          onClose={closeQuickView}
        />
      )}
    </section>
  );
};
