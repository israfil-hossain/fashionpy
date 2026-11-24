import { SearchBar } from "@/components/molecules/SearchBar/SearchBar"

export const HeaderSearch = ({ className }: { className?: string }) => {
  return (
    <div
      className={`mx-auto w-full ${className ?? ""}`}
      data-testid="header-search"
    >
      <SearchBar size="compact" />
    </div>
  )
}
