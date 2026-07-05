export function SiteFooter() {
  return (
    <footer className="mt-16 bg-forge-950">
      <div className="container grid gap-6 py-10 text-sm text-blueprint-100 md:grid-cols-2">
        <div>
          <h3 className="font-display text-xl font-semibold uppercase tracking-[0.05em] text-alloy-white">
            Delta Mill Stores
          </h3>
          <p>78/45 Latouche Road, Anwar Ganj, Mulganj, Kanpur, Uttar Pradesh - 208001, India</p>
        </div>
        <div className="md:text-right">
          <h3 className="font-display text-xl font-semibold uppercase tracking-[0.05em] text-alloy-white">
            Contact
          </h3>
          <p>Ms. Shalini Awasthi</p>
          <p className="font-mono tracking-[0.03em]">Phone: 512-2362054</p>
        </div>
      </div>
    </footer>
  );
}
