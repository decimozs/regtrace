export default function HeroSection() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[0.9fr_1.1fr] gap-8 items-center w-full max-w-5xl mx-auto px-4 text-left">
      <div>
        <div className="w-full max-w-sm rounded-lg border border-border bg-code-bg overflow-hidden">
          <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-border bg-background/50">
            <div className="w-2 h-2 rounded-full bg-[oklch(0.7_0.15_25)]" />
            <div className="w-2 h-2 rounded-full bg-[oklch(0.7_0.15_85)]" />
            <div className="w-2 h-2 rounded-full bg-[oklch(0.6_0.15_240)]" />
            <span className="ml-2 text-xs text-muted font-mono">
              regtrace run
            </span>
          </div>
          <div className="px-3 py-2 font-mono text-xs leading-relaxed">
            <p className="text-muted">
              <span className="text-accent">i</span> Evaluating (5 cases)
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
            <p className="text-muted">
              Suite Score:{" "}
              <span className="text-accent font-semibold">73.3%</span>
            </p>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <div className="space-y-3">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-[-0.03em] leading-[1.05] text-balance">
            A linter for your <span className="text-accent">LLM outputs</span>
          </h1>
          <p className="text-base text-muted leading-relaxed">
            Detect quality degradation before your users notice. Run it in
            development, enforce it in CI.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <a
            href="/docs/tutorials/getting-started"
            className="inline-flex h-10 sm:h-11 items-center justify-center rounded-full bg-accent px-6 sm:px-7 text-sm font-medium text-white transition-all hover:brightness-110 active:scale-95"
          >
            Get Started
          </a>
          <a
            href="https://github.com/decimozs/regtrace"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 sm:h-11 items-center justify-center rounded-full border border-border px-6 sm:px-7 text-sm font-medium text-foreground transition-all hover:bg-card-bg active:scale-95"
          >
            GitHub
          </a>
        </div>
      </div>
    </div>
  );
}
