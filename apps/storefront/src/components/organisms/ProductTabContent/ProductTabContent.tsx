import { ProductPageDetails } from '@/components/cells/ProductPageDetails/ProductPageDetails';
import { ProductAdditionalAttributes } from '@/components/cells/ProductAdditionalAttributes/ProductAdditionalAttributes';
import { ProductDeliveryPanel } from '@/components/cells/ProductDeliveryPanel/ProductDeliveryPanel';
import { ProductTabs } from '@/components/organisms/ProductTabs/ProductTabs';
import { SellerDTO } from '@mercurjs/types';
import { HttpTypes } from '@medusajs/types';
import { AdditionalAttributeProps } from '@/types/product';

/**
 * About / Delivery tab body for the PDP. Replaces the old stacked
 * accordion sections (description + attributes + shipping).
 */
export const ProductTabContent = ({
  product,
  seller,
  leadtimeDays,
}: {
  product: HttpTypes.StoreProduct & {
    attribute_values?: AdditionalAttributeProps[]
  }
  seller?: SellerDTO
  leadtimeDays?: number | null
}) => {
  const about = (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <ProductPageDetails details={product?.description || ""} />
      <div>
        <ProductAdditionalAttributes
          attributes={product?.attribute_values || []}
        />
      </div>
    </div>
  )

  const delivery = (
    <ProductDeliveryPanel seller={seller} leadtimeDays={leadtimeDays} />
  )

  return <ProductTabs about={about} delivery={delivery} />
}
