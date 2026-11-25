import { ReactNode } from "react";

import { SingleColumnPageSkeleton } from "@components/common/skeleton";
import { SingleColumnPage } from "@components/layout/pages";
import { useMe } from "@/hooks/api";

import { SellerStorefrontDesignSection } from "./_components/seller-storefront-design-section";

const Root = ({ children }: { children?: ReactNode }) => {
  const { seller_member, isPending, isError, error } = useMe({
    fields: "+seller.*",
  });

  if (isError) {
    throw error;
  }

  if (isPending || !seller_member?.seller) {
    return <SingleColumnPageSkeleton sections={2} />;
  }

  return (
    <SingleColumnPage data={seller_member.seller}>
      {children ?? (
        <SellerStorefrontDesignSection seller={seller_member.seller} />
      )}
    </SingleColumnPage>
  );
};

export const StorefrontDesignPage = Object.assign(Root, {
  Section: SellerStorefrontDesignSection,
});

export { storefrontDesignLoader as loader } from "./loader";
