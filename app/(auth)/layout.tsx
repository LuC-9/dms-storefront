import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[70vh] bg-blueprint-100 py-8">
      <div className="container">
        <Link
          href="/"
          className="inline-flex font-display text-xl font-semibold uppercase tracking-[0.05em] text-iron-800"
        >
          Delta Mill
        </Link>
      </div>
      {children}
    </div>
  );
}
