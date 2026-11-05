import { AuthShowcase } from '@/components/auth/AuthShowcase';
import { Footer } from '@/components/organisms/Footer/Footer';
import { Header } from '@/components/organisms/Header/Header';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <div className="mx-auto flex w-full max-w-6xl items-stretch gap-8 px-4 py-6 lg:px-8">
        <div className="min-w-0 flex-1">{children}</div>
        <aside className="hidden w-[440px] shrink-0 lg:flex">
          <AuthShowcase
            headline="Style that speaks."
            subline="Discover trends, stories and looks — all in one place."
            className="h-full w-full"
          />
        </aside>
      </div>
      <Footer />
    </>
  );
}
