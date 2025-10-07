export function AnnouncementBar() {
  return (
    <div className="bg-brand-500 text-white py-1.5 px-4 text-center">
      <p className="text-xs md:text-sm font-medium">
        ✨ <span className="font-bold">Free Shipping</span> on orders over $50
        <span className="mx-2">|</span>
        <span className="font-bold">20% OFF</span> your first purchase!
        <span className="mx-2 hidden sm:inline">|</span>
        <span className="hidden sm:inline font-bold">Shop Now</span> and save big! 🎉
      </p>
    </div>
  )
}
