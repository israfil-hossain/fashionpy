export const Dropdown = ({
  children,
  show,
  "data-testid": dataTestId,
}: {
  children: React.ReactNode;
  show: boolean;
  "data-testid"?: string;
}) => {
  if (!show) return null;

  return (
    <div
      className='fixed inset-x-2 bottom-2 z-[70] max-h-[70dvh] overflow-y-auto overscroll-contain rounded-lg border border-primary bg-primary text-primary shadow-lg sm:absolute sm:inset-x-auto sm:bottom-auto sm:left-auto sm:right-[-8px] sm:top-full sm:z-20 sm:mt-0 sm:max-h-none sm:w-max sm:max-w-none sm:overflow-visible sm:rounded-sm'
      data-testid={dataTestId ?? 'dropdown'}
    >
      {children}
    </div>
  );
};
