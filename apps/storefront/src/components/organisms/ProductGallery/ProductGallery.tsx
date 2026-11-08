import { GalleryCarousel } from '@/components/organisms/GalleryCarousel/GalleryCarousel';
import { WishlistButton } from '@/components/cells/WishlistButton/WishlistButton';
import { HttpTypes } from '@medusajs/types';
import { Wishlist } from '@/types/wishlist';

export const ProductGallery = ({
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
  if (!images || images.length === 0) return null;

  return (
    <div data-testid="product-gallery">
      <GalleryCarousel
        images={images}
        productId={productId}
        user={user}
        wishlist={wishlist}
      />
    </div>
  );
};
