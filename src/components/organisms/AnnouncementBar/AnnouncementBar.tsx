export function AnnouncementBar() {
  return (
    <div className="bg-brand-500 text-white h-7 flex items-center justify-center lg:px-4 px-0.5 ">
      <p className="lg:text-xs text-[8px] font-medium">
        ✨ <span className="font-bold">Free Shipping</span> on orders over $50
        <span className="mx-1.5 md:mx-2">|</span>
        <span className="font-bold">20% OFF</span> your first purchase!
        <span className="mx-1.5 md:mx-2 hidden sm:inline">|</span>
        <span className="hidden sm:inline font-bold">Shop Now</span> 🎉
      </p>
    </div>
  )
}
