import { ChatbotWidget } from '@/components/organisms/ChatbotWidget/ChatbotWidget';
import { Footer } from '@/components/organisms/Footer/Footer';
import { Header } from '@/components/organisms/Header/Header';
import { retrieveCustomer } from "@/lib/data/customer";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  // SPEC-011: the chatbot gates on login — same session lookup as Header.
  const user = await retrieveCustomer();

  return (
    <>
      <Header />
      {children}
      <Footer />
      <ChatbotWidget isLoggedIn={!!user} />
    </>
  );
}
