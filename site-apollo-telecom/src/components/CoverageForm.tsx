import { MapPin, Home, Phone, Search } from 'lucide-react';

export function CoverageForm() {
    return (
        <div className="w-full max-w-md mx-auto p-8 rounded-2xl bg-white/50 backdrop-blur-sm border border-white/20 shadow-xl">
            <h2 className="text-xl font-bold text-center text-secondary mb-6 tracking-wide">
                ESCOLHA SUA CIDADE!
            </h2>

            <div className="space-y-4">
                <div className="relative group">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Escolha sua cidade"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                </div>

                <div className="text-center text-sm text-gray-500 my-4">
                    <p>Caso não tenha encontrado a sua cidade</p>
                    <p>verifique a área de cobertura fornecida abaixo.</p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2 relative group">
                        <Home className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="Endereço"
                            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        />
                    </div>
                    <div className="relative group">
                        <input
                            type="text"
                            placeholder="Nº"
                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-center"
                        />
                    </div>
                </div>

                <div className="relative group">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Telefone / WhatsApp"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                </div>

                <button className="w-full py-3 bg-secondary hover:bg-primary text-white font-bold rounded-xl shadow-lg hover:shadow-primary/30 transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 mt-4">
                    <Search size={20} />
                    CONSULTAR
                </button>
            </div>
        </div>
    );
}
