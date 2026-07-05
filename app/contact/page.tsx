export default function ContactPage() {
  return (
    <div className="container space-y-5 py-8 md:py-12">
      <h1 className="font-display text-3xl font-bold uppercase tracking-[0.05em]">Contact</h1>
      <p className="max-w-3xl text-sm text-steel-500">
        Contact Delta Mill Stores for quotations, stock checks, and bulk supply schedules.
      </p>
      <div className="border border-steel-500/25 bg-alloy-white p-5">
        <p className="font-display text-xl font-semibold uppercase tracking-[0.05em]">Delta Mill Stores</p>
        <p>78/45 Latouche Road, Anwar Ganj, Mulganj, Kanpur, Uttar Pradesh - 208001, India</p>
        <p className="font-mono tracking-[0.03em]">Phone: 512-2362054</p>
        <p className="text-sm text-steel-500">Email: deltamillstores@example.com</p>
      </div>
    </div>
  );
}
