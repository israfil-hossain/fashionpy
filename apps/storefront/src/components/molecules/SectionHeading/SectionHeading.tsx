interface SectionHeadingProps {
  title: string
  className?: string
}

export const SectionHeading = ({ title, className }: SectionHeadingProps) => {
  return (
    <div className={`flex flex-col items-center gap-2 ${className ?? ""}`}>
      <h2 className="heading-md uppercase text-gray-900">
        {title}
      </h2>
      <span className="h-1 w-16 rounded-full bg-[rgb(var(--brand-500))]" />
    </div>
  )
}
