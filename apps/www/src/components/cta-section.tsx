import ImagePlaceholder from "./image-placeholder";

export default function CtaSection() {
  return (
    <div className="flex flex-col justify-center items-center w-full h-full gap-8 max-w-lg mx-auto text-center px-4">
      <div className="space-y-4">
        <h2 className="text-3xl sm:text-4xl font-bold">
          Start evaluating today
        </h2>
        <p className="text-muted text-base leading-relaxed">
          No API key needed for format checks. Add a judge provider when you
          want deeper factuality and tone analysis.
        </p>
      </div>

      <form
        className="flex flex-col sm:flex-row gap-3 w-full max-w-md"
        onSubmit={(e) => e.preventDefault()}
      >
        <input
          type="email"
          placeholder="your@email.com"
          className="flex-1 h-12 rounded-full border border-border bg-card-bg px-5 text-sm text-foreground placeholder:text-muted outline-none focus:border-accent transition-colors"
        />
        <button
          type="submit"
          className="h-12 rounded-full bg-accent px-6 text-sm font-medium text-white transition-all hover:bg-accent-dim active:scale-95 flex-shrink-0"
        >
          Get notified
        </button>
      </form>

      <ImagePlaceholder label="Dashboard preview" className="w-full max-w-md" />
    </div>
  );
}
