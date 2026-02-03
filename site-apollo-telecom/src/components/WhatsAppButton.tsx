import { MessageCircle } from 'lucide-react';
import Link from 'next/link';

export function WhatsAppButton() {
    return (
        <Link
            href="https://wa.me/5500000000000"
            target="_blank"
            className="fixed bottom-6 right-6 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform animate-bounce hover:animate-none flex items-center justify-center"
            aria-label="Fale conosco no WhatsApp"
        >
            <MessageCircle size={32} fill="white" className="text-white" />
            <span className="absolute right-full mr-4 bg-white text-gray-800 px-3 py-1 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-sm pointer-events-none">
                Precisa de ajuda?
            </span>
        </Link>
    );
}
