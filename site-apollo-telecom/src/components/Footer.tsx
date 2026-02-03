import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Instagram, Phone, Mail } from 'lucide-react';

export function Footer() {
    return (
        <footer className="bg-secondary text-white pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                    {/* Column 1: Logo */}
                    <div className="flex flex-col items-center md:items-start">
                        <div className="relative w-48 h-16 mb-6">
                            <Image
                                src="/apollo-logobranco.png"
                                alt="Apollo Telecom"
                                fill
                                className="object-contain object-left"
                            />
                        </div>
                        <p className="text-sm text-white/70 text-center md:text-left">
                            Conectando você ao mundo com ultravelocidade e estabilidade.
                        </p>
                    </div>

                    {/* Column 2: Institucional */}
                    <div>
                        <h3 className="text-xl font-bold mb-6 border-b border-white/20 pb-2 inline-block">
                            Institucional
                        </h3>
                        <ul className="space-y-3">
                            <li><Link href="#" className="hover:text-yellow-400 transition-colors">Conheça a Apollo</Link></li>
                            <li><Link href="#" className="hover:text-yellow-400 transition-colors">Fale Conosco</Link></li>
                            <li><Link href="#" className="hover:text-yellow-400 transition-colors">Trabalhe Conosco</Link></li>
                            <li><Link href="#" className="hover:text-yellow-400 transition-colors">Política Privacidade</Link></li>
                        </ul>
                    </div>

                    {/* Column 3: Fale Conosco */}
                    <div>
                        <h3 className="text-xl font-bold mb-6 border-b border-white/20 pb-2 inline-block">
                            Fale Conosco
                        </h3>
                        <ul className="space-y-4">
                            <li className="flex items-center gap-3">
                                <Phone size={20} className="text-yellow-400" />
                                <span className="text-lg font-bold">0800 871 0606</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail size={20} className="text-yellow-400" />
                                <span className="text-sm">contato@apollotelecom.com.br</span>
                            </li>
                        </ul>
                    </div>

                    {/* Column 4: Siga a Apollo */}
                    <div className="flex flex-col items-center md:items-start">
                        <h3 className="text-xl font-bold mb-6 border-b border-white/20 pb-2 inline-block">
                            Siga a Apollo
                        </h3>
                        <div className="flex gap-4 mb-6">
                            <Link href="#" className="bg-white text-secondary p-2 rounded-full hover:bg-yellow-400 hover:text-white transition-all transform hover:scale-110">
                                <Facebook size={24} />
                            </Link>
                            <Link href="#" className="bg-white text-secondary p-2 rounded-full hover:bg-yellow-400 hover:text-white transition-all transform hover:scale-110">
                                <Instagram size={24} />
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="border-t border-white/10 pt-8 text-center text-sm text-white/50">
                    <p>&copy; {new Date().getFullYear()} Apollo Telecom. Todos os direitos reservados.</p>
                </div>
            </div>
        </footer>
    );
}
