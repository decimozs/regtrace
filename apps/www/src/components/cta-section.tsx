export default function CtaSection() {
  return (
    <div className="flex flex-col justify-center items-center w-full h-full gap-10 max-w-lg mx-auto text-center px-4">
      <div className="space-y-4">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-balance">
          Start evaluating today
        </h2>
        <p className="text-muted text-base leading-relaxed max-w-sm mx-auto">
          No API key needed for format checks. Add a judge provider when you
          want deeper factuality and tone analysis.
        </p>
      </div>

      <form
        className="flex flex-col sm:flex-row gap-3 w-full max-w-md"
        onSubmit={(e) => e.preventDefault()}
      >
        <label className="sr-only" htmlFor="cta-email">
          Email address
        </label>
        <input
          id="cta-email"
          type="email"
          placeholder="your@email.com"
          className="flex-1 h-12 rounded-lg border border-border bg-card-bg px-4 text-sm text-foreground placeholder:text-muted outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all"
        />
        <button
          type="submit"
          className="h-12 rounded-lg bg-accent px-6 text-sm font-medium text-white transition-all hover:brightness-110 active:scale-[0.98] flex-shrink-0"
        >
          Get notified
        </button>
      </form>

      <p className="text-xs text-muted">No spam. Unsubscribe anytime.</p>
    </div>
  );
}
