import { Rocket, ShieldCheck, Headphones, Gamepad2 } from 'lucide-react';

export function FeaturesSection() {
    const features = [
        {
            icon: <Rocket size={40} className="text-primary" />,
            title: "Ultra Velocidade",
            description: "Tecnologia 100% Fibra Óptica para você navegar, jogar e assistir sem travamentos."
        },
        {
            icon: <Gamepad2 size={40} className="text-primary" />,
            title: "Ideal para Gamers",
            description: "Ping reduzido e estabilidade máxima para suas partidas online."
        },
        {
            icon: <ShieldCheck size={40} className="text-primary" />,
            title: "Segurança Total",
            description: "IP fixo opcional e proteção contra ataques DDoS para sua empresa ou residência."
        },
        {
            icon: <Headphones size={40} className="text-primary" />,
            title: "Suporte Humanizado",
            description: "Equipe preparada para atender você com rapidez e eficiência 24h."
        }
    ];

    return (
        <section className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold text-dark mb-4">
                        Por que escolher a <span className="text-primary">Apollo?</span>
                    </h2>
                    <p className="text-gray-500 text-lg max-w-2xl mx-auto">
                        Muito mais que internet, entregamos uma experiência de conexão completa.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, idx) => (
                        <div key={idx} className="p-6 rounded-2xl bg-gray-50 hover:bg-white border border-gray-100 hover:border-primary/20 hover:shadow-xl transition-all duration-300 group text-center">
                            <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-bold text-dark mb-3">
                                {feature.title}
                            </h3>
                            <p className="text-gray-500 leading-relaxed">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
