import ChipscrollHero from "@/components/home/ChipscrollHero";

export function Hero() {
  return (
    <section id="inicio" className="pt-24 pb-12 px-4 sm:px-6" style={{ background: "var(--caiena-bg, #faf8f6)" }}>
      <div className="max-w-7xl mx-auto">
        <div
          className="overflow-hidden rounded-3xl"
          style={{
            border: "1px solid rgba(183,110,121,0.22)",
            boxShadow:
              "0 20px 60px rgba(183,110,121,0.10), 0 4px 16px rgba(0,0,0,0.06)",
          }}
        >
          <ChipscrollHero />
        </div>
      </div>
    </section>
  );
}
