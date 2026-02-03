import Image from 'next/image';
import { CoverageForm } from './CoverageForm';
import { Rocket } from 'lucide-react';

export function Hero() {
    return (
        <section className="flex flex-col lg:flex-row h-screen overflow-hidden">
            {/* Left Side - Visuals */}
            <div className="lg:w-1/2 relative bg-dark flex flex-col justify-center items-start overflow-hidden p-6 pt-16 lg:p-16 lg:pt-16">

                {/* Background Image Layer */}
                <div className="absolute inset-0 z-0">
                    <Image
                        src="/hero-bg.png"
                        alt="Background"
                        fill
                        className="object-cover opacity-80"
                        priority
                    />
                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-r from-dark/90 via-dark/50 to-transparent" />
                </div>

                {/* Content */}
                <div className="relative z-10 max-w-xl animate-fade-in-up">
                    <h1 className="text-3xl md:text-5xl lg:text-7xl font-bold leading-tight text-white mb-4 drop-shadow-2xl">
                        Conectando você ao mundo com <span className="text-yellow-400">ultravelocidade.</span>
                    </h1>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="lg:w-1/2 bg-white relative flex flex-col justify-center items-center p-4 lg:p-12">

                {/* Mobile Background Decoration (optional) */}
                <div className="absolute inset-0 bg-gradient-to-b from-purple-50 to-white z-0" />

                <div className="relative z-10 w-full max-w-md flex flex-col items-center">
                    {/* Logo in Form Section */}
                    <div className="flex flex-col items-center mb-4 md:mb-8">
                        <div className="relative w-32 h-12 md:w-64 md:h-24 mb-2 md:mb-4">
                            <Image
                                src="/logo.png"
                                alt="Apollo Telecom"
                                fill
                                className="object-contain"
                            />
                        </div>
                    </div>

                    <CoverageForm />
                </div>
            </div>
        </section>
    );
}
