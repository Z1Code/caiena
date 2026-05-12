"use client";

import { useState, useEffect } from "react";
import { SpringReveal, ScrollReveal } from "@/components/scroll-reveal";
import { useSiteT } from "@/components/site-locale-context";

interface Review {
  id: number;
  clientName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export function Testimonials() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const t = useSiteT().testimonials;

  useEffect(() => {
    fetch("/api/reviews")
      .then((r) => r.json())
      .then(setReviews)
      .catch(() => {});
  }, []);

  if (reviews.length === 0) return null;

  return (
    <section className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="text-center mb-16">
          <p className="text-accent-dark tracking-[0.3em] uppercase text-xs mb-3">{t.label}</p>
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground">
            {t.heading}
          </h2>
          <div className="w-16 h-px bg-accent mx-auto mt-4" />
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.slice(0, 6).map((review, i) => (
            <SpringReveal key={review.id} index={i}>
              <div className="glass-card rounded-2xl p-6 h-full">
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: 5 }, (_, j) => (
                    <svg key={j} className={`w-4 h-4 ${j < review.rating ? "text-gold" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                {review.comment && (
                  <p className="text-sm text-foreground/60 leading-relaxed mb-4">&ldquo;{review.comment}&rdquo;</p>
                )}
                <p className="text-sm font-medium text-foreground">{review.clientName}</p>
              </div>
            </SpringReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
