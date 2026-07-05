import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="bg-forge-950 py-8 text-alloy-white md:py-12">
      <div className="container grid gap-8 md:grid-cols-2 md:items-stretch">
        <div className="flex flex-col justify-center gap-5">
          <h1 className="animate-[reveal-up_480ms_ease-out] font-display text-4xl font-bold uppercase leading-tight tracking-[0.05em] motion-reduce:animate-none md:text-6xl md:tracking-[0.02em]">
            Delta Mill Stores
          </h1>
          <p className="max-w-xl animate-[reveal-up_520ms_ease-out_80ms_both] text-base motion-reduce:animate-none">
            Industrial hardware and machinery suppliers, Kanpur.
          </p>
          <div className="flex flex-wrap gap-3 animate-[reveal-up_560ms_ease-out_150ms_both] motion-reduce:animate-none">
            <Button
              asChild
              className="rounded-none border border-safety-orange bg-safety-orange font-display uppercase tracking-[0.05em] text-alloy-white hover:bg-safety-orange/90"
            >
              <Link href="/catalogue">Browse catalogue</Link>
            </Button>
          </div>
          <p className="animate-[reveal-up_620ms_ease-out_220ms_both] font-mono text-sm tracking-[0.03em] text-steel-500 motion-reduce:animate-none">
            512-2362054
          </p>
        </div>
        <div className="relative h-[40vw] min-h-[220px] overflow-hidden border border-steel-500 bg-iron-800 animate-[reveal-up_620ms_ease-out_140ms_both] motion-reduce:animate-none md:h-[420px]">
          <Image
            src="https://images.unsplash.com/photo-1581093458791-9d15482442f6?auto=format&fit=crop&w=1200&q=80"
            alt="Industrial machinery equipment"
            fill
            className="object-cover opacity-80 transition-transform duration-500 ease-out motion-safe:hover:scale-[1.03]"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
          <div className="absolute inset-0 bg-forge-950/35" />
        </div>
      </div>
    </section>
  );
}
