"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import CtaSection from "@/components/cta-section";
import FeaturesSection from "@/components/features-section";
import FooterSection from "@/components/footer-section";
import HeroSection from "@/components/hero-section";
import HowItWorksSection from "@/components/how-it-works-section";
import NavDots from "@/components/nav-dots";

const SECTIONS = ["Hero", "Features", "How it works", "Get started", "Footer"];

export default function Home() {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  const handleDotClick = useCallback((index: number) => {
    const container = scrollRef.current;
    if (!container) return;
    const target = sectionRefs.current[index];
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "start",
      });
    }
  }, []);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute("data-index"));
            if (!Number.isNaN(index)) {
              setActiveIndex(index);
            }
            entry.target.classList.add("scroll-section-in--viewport");
          } else {
            entry.target.classList.remove("scroll-section-in--viewport");
          }
        }
      },
      {
        root: container,
        rootMargin: "0px",
        threshold: 0.5,
      },
    );

    observerRef.current = observer;

    for (const el of sectionRefs.current) {
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <NavDots
        sections={SECTIONS}
        activeIndex={activeIndex}
        onClick={handleDotClick}
      />
      {/* Scroll hint — fades out after first section */}
      {activeIndex === 0 && (
        <div className="scroll-hint">
          <span className="scroll-hint-arrow text-muted">→</span>
          <span className="scroll-hint-text">Scroll</span>
        </div>
      )}
      <div className="scroll-container" ref={scrollRef}>
        <section
          className="scroll-section"
          data-index={0}
          ref={(el) => {
            sectionRefs.current[0] = el;
          }}
        >
          <div className="scroll-section-inner">
            <HeroSection />
          </div>
        </section>

        <section
          className="scroll-section"
          data-index={1}
          ref={(el) => {
            sectionRefs.current[1] = el;
          }}
        >
          <div className="scroll-section-inner">
            <FeaturesSection />
          </div>
        </section>

        <section
          className="scroll-section"
          data-index={2}
          ref={(el) => {
            sectionRefs.current[2] = el;
          }}
        >
          <div className="scroll-section-inner">
            <HowItWorksSection />
          </div>
        </section>

        <section
          className="scroll-section"
          data-index={3}
          ref={(el) => {
            sectionRefs.current[3] = el;
          }}
        >
          <div className="scroll-section-inner">
            <CtaSection />
          </div>
        </section>

        <section
          className="scroll-section"
          data-index={4}
          ref={(el) => {
            sectionRefs.current[4] = el;
          }}
        >
          <div className="scroll-section-inner">
            <FooterSection />
          </div>
        </section>
      </div>
    </>
  );
}
