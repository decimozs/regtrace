export default function HeroSection() {
  return (
    <div className="flex flex-col justify-center items-center w-full h-full text-center gap-10 max-w-3xl mx-auto">
      <div className="space-y-5">
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-[-0.03em] leading-[1.05] text-balance">
          A linter for your
          <br />
          <span className="text-accent">LLM outputs</span>
        </h1>
        <p className="text-lg sm:text-xl text-muted max-w-xl mx-auto leading-relaxed">
          Detect quality degradation before your users notice. Run it in
          development, enforce it in CI. No runtime dependencies.
        </p>
      </div>

      <div className="flex items-center gap-4 flex-wrap justify-center">
        <a
          href="/docs/tutorials/getting-started"
          className="inline-flex h-12 items-center justify-center rounded-full bg-accent px-8 text-sm font-medium text-white transition-all hover:brightness-110 active:scale-95"
        >
          Get Started
        </a>
        <a
          href="https://github.com/decimozs/regtrace"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-12 items-center justify-center rounded-full border border-border px-8 text-sm font-medium text-foreground transition-all hover:bg-card-bg active:scale-95"
        >
          GitHub
        </a>
      </div>

      {/* Terminal demo */}
      <div className="w-full max-w-xl rounded-lg border border-border bg-code-bg overflow-hidden">
        <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-border bg-background/50">
          <div className="w-2.5 h-2.5 rounded-full bg-[oklch(0.7_0.15_25)]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[oklch(0.7_0.15_85)]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[oklch(0.6_0.15_240)]" />
          <span className="ml-2 text-xs text-muted font-mono">
            regtrace run
          </span>
        </div>
        <div className="px-4 py-3 font-mono text-sm leading-relaxed">
          <div className="flex flex-col gap-1">
            <p className="text-muted">
              <span className="text-accent">i</span> Evaluating
              "customer-support-qa" (5 test cases)
            </p>
            <p className="text-muted">
              <span className="text-green-400/80">✓</span> cs-001:{" "}
              <span className="text-green-400/80">100%</span>
            </p>
            <p className="text-muted">
              <span className="text-green-400/80">✓</span> cs-003:{" "}
              <span className="text-green-400/80">97%</span>
            </p>
            <p className="text-muted">
              <span className="text-red-400/80">✗</span> cs-002:{" "}
              <span className="text-red-400/80">58%</span>
            </p>
            <p className="text-foreground/80">
              Suite Score:{" "}
              <span className="text-accent font-semibold">73.3%</span>{" "}
              <span className="text-muted text-xs">≥ 70% threshold</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
