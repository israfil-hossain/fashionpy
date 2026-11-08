import { ProductCarousel } from '@/components/cells/ProductCarousel/ProductCarousel';
import { WishlistButton } from '@/components/cells/WishlistButton/WishlistButton';
import { HttpTypes } from '@medusajs/types';
import { Wishlist } from '@/types/wishlist';

export const GalleryCarousel = ({
  images,
  productId,
  user,
  wishlist,
}: {
  images: HttpTypes.StoreProduct['images'];
  productId?: string;
  user?: Parameters<typeof WishlistButton>[0]['user'];
  wishlist?: Wishlist[];
}) => {
  return (
    <div className='w-full border p-1 rounded-sm' data-testid="gallery-carousel">
      <ProductCarousel
        slides={images}
        productId={productId}
        user={user}
        wishlist={wishlist}
      />
    </div>
  );
};
