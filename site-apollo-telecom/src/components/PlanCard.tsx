import { Check, Wifi } from 'lucide-react';
import { Plan } from '@/data/plans';

interface PlanCardProps {
    plan: Plan;
}

export function PlanCard({ plan }: PlanCardProps) {
    return (
        <div className={`relative p-8 rounded-3xl border transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl flex flex-col items-center text-center group
            ${plan.isPopular
                ? 'bg-gradient-to-b from-secondary/20 to-dark border-secondary shadow-lg shadow-secondary/10'
                : 'bg-dark/50 border-white/10 hover:border-white/20'
            }
        `}>
            {plan.isPopular && (
                <div className="absolute -top-4 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-bold py-1 px-4 rounded-full text-sm shadow-lg">
                    MAIS VENDIDO
                </div>
            )}

            <div className="mb-6">
                <span className="text-sm text-gray-400 uppercase tracking-widest font-semibold">Velocidade</span>
                <h3 className="text-4xl font-black text-white mt-1 group-hover:scale-105 transition-transform">
                    {plan.speed}
                </h3>
            </div>

            <div className="mb-8 relative py-6 w-full border-t border-b border-white/5">
                <span className="text-sm text-gray-400 align-top">R$</span>
                <span className="text-6xl font-bold text-white">{plan.price.split(',')[0]}</span>
                <span className="text-xl text-gray-400 font-bold">,{plan.price.split(',')[1]}</span>
                <span className="text-gray-500 text-sm ml-1">/mês</span>
            </div>

            <div className="space-y-4 w-full mb-8 flex-grow">
                <div className="flex items-center gap-3 text-white justify-center bg-white/5 p-2 rounded-lg">
                    <Wifi size={20} className="text-primary" />
                    <span className="font-semibold">{plan.wifi}</span>
                </div>
                {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-gray-300 justify-center">
                        <Check size={18} className="text-green-400" />
                        <span>{feature}</span>
                    </div>
                ))}
            </div>

            <button className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg
                ${plan.isPopular
                    ? 'bg-primary hover:bg-secondary text-white shadow-primary/25'
                    : 'bg-white text-dark hover:bg-gray-200'
                }
            `}>
                ASSINE JÁ
            </button>
        </div>
    );
}
