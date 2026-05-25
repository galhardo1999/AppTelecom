import { Hero } from '@/components/Hero';
import { WhatsAppButton } from '@/components/WhatsAppButton';

export default function Home() {
  return (
    <main className="min-h-screen relative">
      <Hero />
      <WhatsAppButton />
    </main>
  );
}
