'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Menu, X, User } from 'lucide-react';

export function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    return (
        <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-dark/80 backdrop-blur-md border-b border-white/10">
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="relative h-10 w-32 md:h-12 md:w-40 hover:opacity-90 transition-opacity">
                    <Image
                        src="/apollo-logobranco.png"
                        alt="Apollo Telecom"
                        fill
                        className="object-contain object-left"
                        priority
                    />
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-8">
                    <Link href="/" className="text-white hover:text-primary transition-colors font-medium text-sm lg:text-base">
                        HOME
                    </Link>
                    <Link href="/#planos" className="text-white hover:text-primary transition-colors font-medium text-sm lg:text-base">
                        PLANOS
                    </Link>
                    <Link href="/#sobre" className="text-white hover:text-primary transition-colors font-medium text-sm lg:text-base">
                        SOBRE NÓS
                    </Link>
                    <Link href="/#contato" className="text-white hover:text-primary transition-colors font-medium text-sm lg:text-base">
                        CONTATO
                    </Link>
                </nav>

                {/* CTA Button (Desktop) */}
                <div className="hidden md:block">
                    <Link
                        href="#"
                        className="px-6 py-2 bg-primary hover:bg-secondary text-white rounded-full font-bold text-sm transition-all shadow-lg hover:shadow-primary/20 flex items-center gap-2"
                    >
                        <User size={18} />
                        CENTRAL DO ASSINANTE
                    </Link>
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
                    onClick={toggleMenu}
                    aria-label="Toggle menu"
                >
                    {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
                </button>
            </div>

            {/* Mobile Navigation Overlay */}
            {isMenuOpen && (
                <div className="md:hidden absolute top-20 left-0 w-full bg-dark border-b border-white/10 shadow-2xl animate-fade-in-up">
                    <div className="flex flex-col p-6 space-y-4">
                        <Link
                            href="/"
                            className="text-white hover:text-primary font-medium text-lg py-2 border-b border-white/5"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            HOME
                        </Link>
                        <Link
                            href="/#planos"
                            className="text-white hover:text-primary font-medium text-lg py-2 border-b border-white/5"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            PLANOS
                        </Link>
                        <Link
                            href="/#sobre"
                            className="text-white hover:text-primary font-medium text-lg py-2 border-b border-white/5"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            SOBRE NÓS
                        </Link>
                        <Link
                            href="/#contato"
                            className="text-white hover:text-primary font-medium text-lg py-2 border-b border-white/5"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            CONTATO
                        </Link>

                        <Link
                            href="#"
                            className="mt-4 px-6 py-3 bg-primary text-white rounded-xl font-bold text-center flex items-center justify-center gap-2"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            <User size={20} />
                            CENTRAL DO ASSINANTE
                        </Link>
                    </div>
                </div>
            )}
        </header>
    );
}
