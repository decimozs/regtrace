"use client";

interface NavDotsProps {
  sections: string[];
  activeIndex: number;
  onClick: (index: number) => void;
}

export default function NavDots({
  sections,
  activeIndex,
  onClick,
}: NavDotsProps) {
  return (
    <nav
      className="fixed right-5 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-3"
      aria-label="Section navigation"
    >
      {sections.map((section, i) => (
        <button
          key={section}
          type="button"
          aria-label={`Go to ${section}`}
          onClick={() => onClick(i)}
          className="group relative flex items-center justify-center"
        >
          <span
            className={`block transition-all duration-500 rounded-full ${
              i === activeIndex
                ? "w-3 h-3 bg-accent ring-2 ring-accent/30"
                : "w-2 h-2 bg-border hover:bg-foreground/40"
            }`}
          />
          <span
            className={`absolute right-full mr-3 px-2 py-0.5 rounded text-xs font-mono text-foreground bg-card-bg border border-border opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap ${
              i === activeIndex ? "opacity-100" : "opacity-0"
            }`}
          >
            {section}
          </span>
        </button>
      ))}
    </nav>
  );
}
