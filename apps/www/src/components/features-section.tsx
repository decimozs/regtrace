const pillars = [
  {
    title: "Factuality",
    description:
      "Are claims accurate and faithful to expected output? Detects hallucinations and unsupported assertions in RAG responses.",
    accent: "bg-[oklch(0.6_0.2_25)]",
    code: "claim_precision: 0.92\nhallucination_rate: 0.03",
  },
  {
    title: "Tone",
    description:
      "Does output match expected voice and register? Evaluates formality, sentiment, assertiveness, and persona consistency.",
    accent: "bg-[oklch(0.65_0.15_160)]",
    code: "formality: 0.87\nsentiment: 0.91",
  },
  {
    title: "Format",
    description:
      "Does output conform to required structure? Validates JSON schema, markdown, code blocks, and forbidden patterns.",
    accent: "bg-[oklch(0.6_0.15_240)]",
    code: "json_validity: 1.0\nmarkdown: pass",
  },
  {
    title: "Regression",
    description:
      "Is quality trending down from baseline? Automatically detects score drops with version-aware comparison.",
    accent: "bg-[oklch(0.7_0.15_85)]",
    code: "delta: -0.03\nstatus: clean",
  },
];

export default function FeaturesSection() {
  return (
    <div className="flex flex-col justify-center w-full h-full max-w-5xl mx-auto gap-10 px-4">
      <div className="text-center space-y-3">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-balance">
          Four dimensions of quality
        </h2>
        <p className="text-muted text-base max-w-xl mx-auto leading-relaxed">
          Every evaluation scores across four pillars. You get a clear answer to
          why a response failed, not just a number.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {/* Top row — 2 wider cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pillars.slice(0, 2).map((pillar) => (
            <div
              key={pillar.title}
              className="rounded-lg border border-border bg-card-bg overflow-hidden transition-all hover:border-foreground/30"
            >
              <div className={`h-1 ${pillar.accent}`} />
              <div className="p-6 space-y-4">
                <h3 className="text-lg font-semibold tracking-tight">
                  {pillar.title}
                </h3>
                <p className="text-sm text-muted leading-relaxed">
                  {pillar.description}
                </p>
                <div className="rounded-md bg-code-bg border border-border p-3 overflow-x-auto">
                  <pre className="text-xs text-muted font-mono leading-relaxed">
                    {pillar.code}
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom row — 2 cards with simpler layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pillars.slice(2, 4).map((pillar) => (
            <div
              key={pillar.title}
              className="rounded-lg border border-border bg-card-bg overflow-hidden transition-all hover:border-foreground/30 flex flex-col"
            >
              <div className={`h-1 ${pillar.accent}`} />
              <div className="p-5 flex-1 flex flex-col justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold tracking-tight mb-1">
                    {pillar.title}
                  </h3>
                  <p className="text-sm text-muted leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
                <div className="rounded-md bg-code-bg border border-border p-3 overflow-x-auto">
                  <pre className="text-xs text-muted font-mono leading-relaxed">
                    {pillar.code}
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
