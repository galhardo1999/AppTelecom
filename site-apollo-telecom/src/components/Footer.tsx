import Link from 'next/link';

export function Footer() {
    return (
        <footer className="bg-secondary text-white py-12 px-4 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-white blur-3xl" />
                <div className="absolute top-20 right-20 w-60 h-60 rounded-full bg-white blur-3xl" />
            </div>

            <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                <div className="flex flex-col md:flex-row items-center gap-2 text-center md:text-left">
                    <span className="text-xl md:text-2xl font-light">JÁ É CLIENTE <span className="font-bold">APOLLO?</span></span>
                </div>

                <Link
                    href="#"
                    className="bg-white text-secondary px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 hover:scale-105 transition-all shadow-lg flex items-center gap-2"
                >
                    ACESSE A CENTRAL DO ASSINANTE &gt;
                </Link>
            </div>

            <div className="mt-12 text-center text-sm text-white/60 border-t border-white/10 pt-8">
                &copy; 2026 Apollo Telecom. Todos os direitos reservados.
            </div>
        </footer>
    );
}
