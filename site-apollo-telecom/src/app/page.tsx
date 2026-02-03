import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { Footer } from '@/components/Footer';
import { WhatsAppButton } from '@/components/WhatsAppButton';

export default function Home() {
  return (
    <main className="min-h-screen relative">
      <Header />
      <Hero />
      <Footer />
      <WhatsAppButton />
    </main>
  );
}

