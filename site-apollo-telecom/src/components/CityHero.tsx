import Image from 'next/image';

interface CityHeroProps {
    cityName: string;
}

export function CityHero({ cityName }: CityHeroProps) {
    return (
        <section className="relative w-full h-[50vh] flex items-center justify-center overflow-hidden bg-dark">
            {/* Background Image Layer */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/hero-bg.png"
                    alt="Background"
                    fill
                    className="object-cover opacity-60"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-dark/50 to-dark" />
            </div>

            <div className="relative z-10 text-center px-4 animate-fade-in-up">
                <span className="inline-block py-1 px-3 rounded-full bg-secondary/50 border border-secondary text-sm font-semibold text-white mb-4 backdrop-blur-sm">
                    DISPONÍVEL EM SUA REGIÃO
                </span>
                <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 drop-shadow-xl">
                    Internet Fibra Óptica em <br />
                    <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-white">
                        {cityName}
                    </span>
                </h1>
                <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
                    A melhor conexão para jogos, streaming e trabalho. Escolha seu plano ideal abaixo.
                </p>
            </div>
        </section>
    );
}
