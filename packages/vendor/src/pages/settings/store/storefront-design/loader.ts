import { LoaderFunctionArgs } from "react-router-dom";

import { meQueryOptions } from "@hooks/api/members";
import { queryClient } from "@lib/query-client";

export const storefrontDesignLoader = async (_: LoaderFunctionArgs) => {
  return queryClient.ensureQueryData({
    ...meQueryOptions({ fields: "+seller.*" }),
    staleTime: 90000,
  });
};
