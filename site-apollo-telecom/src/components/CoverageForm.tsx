'use client';
import { MapPin, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const CITY_ROUTES: Record<string, string> = {
    'Araçatuba': '/aracatuba',
    'Birigui': '/birigui',
    'Bento de Abreu': '/bento-de-abreu',
    'Guararapes': '/guararapes',
    'Panorama': '/panorama',
    'Paulicéia': '/pauliceia',
    'Santa Mercedes': '/santa-mercedes',
    'Presidente Venceslau': '/presidente-venceslau',
};

export function CoverageForm() {
    const router = useRouter();
    const [selectedCity, setSelectedCity] = useState('');

    const handleConsult = () => {
        if (!selectedCity) {
            // Optional: Add toast or alert here if no city is selected
            return;
        }

        const route = CITY_ROUTES[selectedCity];
        if (route) {
            router.push(route);
        }
    };
    return (
        <div className="w-full max-w-md mx-auto p-6 md:p-8 rounded-2xl bg-white/50 backdrop-blur-sm border border-white/20 shadow-xl">
            <h2 className="text-lg md:text-xl font-bold text-center text-secondary mb-4 md:mb-6 tracking-wide">
                ESCOLHA SUA CIDADE!
            </h2>

            <div className="space-y-4">
                <div className="relative group">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
                    <select
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-white text-gray-700 appearance-none cursor-pointer"
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                    >
                        <option value="" disabled>Escolha sua cidade</option>
                        <option value="Araçatuba">Araçatuba</option>
                        <option value="Birigui">Birigui</option>
                        <option value="Bento de Abreu">Bento de Abreu</option>
                        <option value="Guararapes">Guararapes</option>
                        <option value="Panorama">Panorama</option>
                        <option value="Paulicéia">Paulicéia</option>
                        <option value="Santa Mercedes">Santa Mercedes</option>
                        <option value="Presidente Venceslau">Presidente Venceslau</option>
                    </select>
                </div>



                <button
                    onClick={handleConsult}
                    className="w-full py-3 bg-secondary hover:bg-primary text-white font-bold rounded-xl shadow-lg hover:shadow-primary/30 transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 mt-4"
                >
                    <Search size={20} />
                    CONSULTAR
                </button>
            </div>
        </div>
    );
}
