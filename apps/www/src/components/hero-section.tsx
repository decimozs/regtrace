import ImagePlaceholder from "./image-placeholder";

export default function HeroSection() {
  return (
    <div className="flex flex-col justify-center items-center w-full h-full text-center gap-8 max-w-3xl mx-auto">
      <div className="space-y-4">
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-tight">
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
          className="inline-flex h-12 items-center justify-center rounded-full bg-accent px-8 text-sm font-medium text-white transition-all hover:bg-accent-dim active:scale-95"
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

      <ImagePlaceholder
        label="Terminal screenshot"
        className="mt-8 w-full max-w-lg"
      />
    </div>
  );
}
