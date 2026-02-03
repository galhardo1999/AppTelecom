import Image from 'next/image';
import { CoverageForm } from './CoverageForm';
import { Rocket } from 'lucide-react';

export function Hero() {
    return (
        <section className="flex flex-col lg:flex-row min-h-screen">
            {/* Left Side - Visuals */}
            <div className="lg:w-1/2 relative bg-dark flex flex-col justify-center items-start overflow-hidden p-8 lg:p-16">

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
                    <h1 className="text-5xl lg:text-7xl font-bold leading-tight text-white mb-4 drop-shadow-2xl">
                        <span className="text-yellow-400">Fácil</span> como sempre<br />
                        <span className="text-yellow-400">Ágil</span> como nunca!
                    </h1>
                    <p className="text-lg text-gray-300 font-light max-w-md">
                        A internet de fibra óptica que conecta você ao mundo com estabilidade e ultravelocidade.
                    </p>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="lg:w-1/2 bg-white relative flex flex-col justify-center items-center p-8 lg:p-12">

                {/* Mobile Background Decoration (optional) */}
                <div className="absolute inset-0 bg-gradient-to-b from-purple-50 to-white z-0" />

                <div className="relative z-10 w-full max-w-md flex flex-col items-center">
                    {/* Logo in Form Section */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="relative w-64 h-24 mb-4">
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
