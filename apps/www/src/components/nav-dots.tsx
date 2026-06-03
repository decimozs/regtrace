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
    <nav className="fixed right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-3">
      {sections.map((section, i) => (
        <button
          key={section}
          type="button"
          aria-label={`Go to ${section}`}
          onClick={() => onClick(i)}
          className={`w-2.5 h-2.5 rounded-full border transition-all duration-300 ${
            i === activeIndex
              ? "bg-accent border-accent scale-125"
              : "bg-transparent border-border hover:border-foreground/50"
          }`}
        />
      ))}
    </nav>
  );
}
