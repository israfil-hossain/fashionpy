import { assetUrl } from "../../utils/asset-url";

export const WizardPreview = () => {
  return (
    <div className="hidden lg:flex flex-1 relative overflow-hidden bg-white">
      <img
        src={assetUrl("/auth-banner.jpg")}
        alt=""
        className="h-full w-full object-contain"
      />
    </div>
  );
};
