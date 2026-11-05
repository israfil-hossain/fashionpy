import { AuthShowcase } from "@mercurjs/dashboard-shared";
import { ReactNode } from "react";

type AuthLayoutProps = {
  children: ReactNode;
};

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="flex h-dvh w-dvw overflow-hidden" data-testid="login-page">
      <div className="bg-ui-bg-base border-ui-border-base flex h-full w-full flex-col overflow-y-auto border-r lg:w-[584px] lg:shrink-0">
        <div className="flex flex-1 flex-col px-8 pb-8 pt-8 lg:px-14 lg:pb-12 lg:pt-12">
          {children}
        </div>
      </div>
      <div className="relative hidden flex-1 overflow-hidden bg-[#FAF8FD] lg:flex">
        <AuthShowcase
          headline="Run every store from one rail."
          subline="Orders, stock and payouts for all your fashion stores, together in one dashboard."
          className="h-full w-full rounded-none border-0"
        />
      </div>
    </div>
  );
};
