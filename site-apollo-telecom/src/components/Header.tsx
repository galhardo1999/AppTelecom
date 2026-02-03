import Link from 'next/link';
import Image from 'next/image';

export function Header() {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 p-6 flex justify-center md:justify-start">
            <Link href="/" className="flex items-center gap-2 group">
                <div className="relative h-12 w-48 group-hover:scale-105 transition-transform">
                    <Image
                        src="/logo.png"
                        alt="Apollo Telecom"
                        fill
                        className="object-contain object-left"
                        priority
                    />
                </div>
            </Link>
        </header>
    );
}
