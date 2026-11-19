import { ProductPageAccordion } from '@/components/molecules/ProductPageAccordion/ProductPageAccordion';
import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';

/**
 * Shipping & Returns accordion — copy mirrors the platform policies
 * (/policies/shipping, /policies/return-refund, /policies/exchange):
 * Pathao/Steadfast delivery across Bangladesh and the 30-day window.
 */
export const ProductDetailsShipping = () => {
  return (
    <ProductPageAccordion
      heading='Shipping & Returns'
      defaultOpen={false}
      data-testid="product-details-shipping"
    >
      <div className='product-details'>
        <ul>
          <li>
            Sellers usually dispatch within 1–3 business days. Delivery across
            Bangladesh via Pathao or Steadfast — typically 1–2 days in Dhaka
            and 2–5 days elsewhere after dispatch. Delivery charges (if any)
            are shown at checkout; free-delivery offers apply when running.
          </li>
          <li>
            Returns and size exchanges are accepted within 30 days of
            delivery if the item is unused and in its original condition with
            tags. Request a return from Your Orders — we arrange the pickup.
          </li>
          <li>
            <LocalizedClientLink href="/policies/shipping" className="underline">
              Shipping Policy
            </LocalizedClientLink>
            {" · "}
            <LocalizedClientLink href="/policies/return-refund" className="underline">
              Return &amp; Refund Policy
            </LocalizedClientLink>
            {" · "}
            <LocalizedClientLink href="/policies/exchange" className="underline">
              Exchange Policy
            </LocalizedClientLink>
          </li>
        </ul>
      </div>
    </ProductPageAccordion>
  );
};
