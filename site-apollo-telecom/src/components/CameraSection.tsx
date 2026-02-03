import { Moon, Radio, Mic, Video, Shield, Smartphone, ArrowRight } from 'lucide-react';
import Image from 'next/image';

export function CameraSection() {
    const features = [
        {
            icon: <Moon size={32} className="text-secondary" />,
            title: "Visão Noturna",
            description: "Com infravermelho com alcance de 30 metros"
        },
        {
            icon: <Radio size={32} className="text-secondary" />,
            title: "Detector de movimentos",
            description: ""
        },
        {
            icon: <Mic size={32} className="text-secondary" />,
            title: "Microfone e alto falante",
            description: "Com comunicação bidirecional"
        },
        {
            icon: <Video size={32} className="text-secondary" />,
            title: "Gravação da imagem",
            description: "Com armazenamento em cartão de memória"
        },
        {
            icon: <Shield size={32} className="text-secondary" />,
            title: "Resistente a água",
            description: ""
        },
        {
            icon: <Smartphone size={32} className="text-secondary" />,
            title: "Monitore em tempo real",
            description: "Por aplicativo compatível com Android ou iOS"
        }
    ];

    return (
        <section className="bg-white">
            {/* Banner Section */}
            <div className="relative bg-secondary overflow-hidden">
                {/* Background Curve Effect (Optional CSS trick or SVG) */}
                <div className="absolute top-0 right-0 w-1/2 h-full bg-slate-100 -skew-x-12 translate-x-20 hidden lg:block" />

                <div className="max-w-7xl mx-auto px-6 relative z-10 flex flex-col lg:flex-row items-center justify-between py-12 lg:py-0">

                    {/* Text Content */}
                    <div className="lg:w-1/2 text-white py-12">
                        <h2 className="text-3xl md:text-5xl font-bold leading-tight mb-4">
                            Uma <span className="text-yellow-400">internet</span> que vai além da <br />
                            <span className="text-4xl md:text-6xl">velocidade!</span>
                        </h2>
                        <p className="text-lg mb-8 max-w-xl">
                            Por mais <span className="font-bold text-yellow-400 text-xl">R$ 16,90</span> inclua em seu plano a nossa câmera de monitoramento e garanta segurança para a sua empresa ou para a sua residência.
                        </p>
                        <button className="bg-yellow-400 text-secondary font-black text-xl px-8 py-3 rounded hover:bg-yellow-300 transition-colors shadow-lg uppercase tracking-wide">
                            Adquira Já
                        </button>
                    </div>

                    {/* Image Content */}
                    <div className="lg:w-1/2 flex justify-center lg:justify-end relative mt-8 lg:mt-0">
                        {/* Placeholder for Camera Image - In a real scenario we'd use the provided asset */}
                        {/* Using a generated-like placeholder composition */}
                        <div className="relative w-64 h-64 md:w-80 md:h-80 bg-gradient-to-br from-gray-100 to-gray-300 rounded-full flex items-center justify-center shadow-2xl border-4 border-white">
                            <Video size={120} className="text-secondary opacity-50" />
                            <div className="absolute bottom-4 bg-white px-4 py-1 rounded-full shadow text-xs font-bold text-secondary">
                                Câmera Wi-Fi
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Icons Row */}
            <div className="max-w-7xl mx-auto px-6 py-20">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
                    {features.map((feature, idx) => (
                        <div key={idx} className="flex flex-col items-center text-center group">
                            <div className="w-24 h-24 rounded-full border-2 border-secondary flex items-center justify-center mb-4 group-hover:bg-secondary group-hover:text-white transition-all duration-300">
                                <div className="group-hover:text-white transition-colors">
                                    {feature.icon}
                                </div>
                            </div>
                            <h3 className="font-bold text-sm text-dark mb-2">{feature.title}</h3>
                            {feature.description && (
                                <p className="text-xs text-gray-500 leading-tight px-2">
                                    {feature.description}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
