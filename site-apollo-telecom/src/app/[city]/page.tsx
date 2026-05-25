import { Header } from '@/components/Header';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { CityHero } from '@/components/CityHero';
import { PlanCard } from '@/components/PlanCard';
import { FeaturesSection } from '@/components/FeaturesSection';
import { CameraSection } from '@/components/CameraSection';
import { Footer } from '@/components/Footer';
import { formatCityName, getPlansForCity, hasCityPage } from '@/data/plans';
import { notFound } from 'next/navigation';

interface PageProps {
    params: Promise<{
        city: string;
    }>;
}

// Ensure the component is async to handle params correctly in Next.js 13+ (or 15 in this case)
export default async function CityPage(props: PageProps) {
    // In Next.js 15, params might need to be awaited if they follow the new pattern, 
    // but typically strictly typed as Promise or just object depending on version. 
    // Assuming standard behavior for now. if it fails I will check params type.
    const params = await props.params;

    // Safety check for params
    if (!params || !params.city) {
        return notFound();
    }

    const { city } = params;
    if (!hasCityPage(city)) {
        return notFound();
    }

    const cityName = formatCityName(city);
    const plans = getPlansForCity(city);

    return (
        <main className="min-h-screen bg-dark">
            <Header />

            <CityHero cityName={cityName} />

            {/* Plans Section */}
            <section className="py-20 px-4 relative z-20 -mt-20">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-center">
                        {plans.map((plan, idx) => (
                            <PlanCard key={idx} plan={plan} />
                        ))}
                    </div>
                </div>
            </section>

            <FeaturesSection />
            <CameraSection />
            <Footer />
            <WhatsAppButton />
        </main>
    );
}
