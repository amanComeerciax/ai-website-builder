/**
 * FeaturesGallery — adapted from GalleryHoverCarousel (ruixen.com)
 * Adapted for: Vite + React + framer-motion + react-router-dom
 * No next/image, no next/link, no "use client" directive.
 */
import { useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  useCarousel,
} from '@/components/ui/carousel';

// ─── Feature data ──────────────────────────────────────────────────────────
const FEATURES = [
  {
    id: 'feat-1',
    num: '01',
    title: 'AI-Powered Code Generation',
    summary:
      'Describe your website in plain English and watch IndiForge AI generate production-ready React, Express, and MongoDB code — in under 2 minutes.',
    url: '/signup',
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80&auto=format&fit=crop',
  },
  {
    id: 'feat-2',
    num: '02',
    title: '50+ Smart Templates',
    summary:
      'Our AI picks from 50+ stunning, high-converting templates tailored for your business — SaaS, e-commerce, portfolios, and more.',
    url: '/templates',
    image: 'https://images.unsplash.com/photo-1618477388954-7852f32655ec?w=800&q=80&auto=format&fit=crop',
  },
  {
    id: 'feat-3',
    num: '03',
    title: 'AI-Powered Copy & Design',
    summary:
      'Stuck on what to write? Our AI generates compelling headlines, descriptions, and layouts in seconds — tailored to your audience.',
    url: '/signup',
    image: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&q=80&auto=format&fit=crop',
  },
  {
    id: 'feat-4',
    num: '04',
    title: 'Optimized for Speed',
    summary:
      'Every millisecond counts. Our websites load in record time, ensuring better SEO, higher conversions, and a seamless experience.',
    url: '/signup',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80&auto=format&fit=crop',
  },
  {
    id: 'feat-5',
    num: '05',
    title: 'Mobile-First & Responsive',
    summary:
      'Build websites that adapt perfectly to any screen — ensuring a smooth and engaging experience on mobile, tablet, and desktop.',
    url: '/signup',
    image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&q=80&auto=format&fit=crop',
  },
];

// ─── Inner nav buttons that use carousel context ─────────────────────────
function NavButtons() {
  const { index, setIndex, itemsCount } = useCarousel();
  return (
    <div className="features-gallery-nav">
      <button
        className="feat-gallery-nav-btn"
        onClick={() => setIndex(Math.max(0, index - 1))}
        disabled={index === 0}
        aria-label="Previous feature"
      >
        <ChevronLeft size={18} />
      </button>
      <button
        className="feat-gallery-nav-btn"
        onClick={() => setIndex(Math.min(itemsCount - 1, index + 1))}
        disabled={index >= itemsCount - 1}
        aria-label="Next feature"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────
export default function FeaturesGallery() {
  return (
    <section id="features-overview" className="features-gallery-section">
      <div className="features-gallery-inner">

        {/* Header row */}
        <div className="features-gallery-header">
          <div className="features-gallery-heading">
            <span className="features-v2-badge">Powerful Features</span>
            <h2 className="features-gallery-title">
              <span className="features-v2-title-accent">Powerful Features</span>
              {' '}
              <span className="features-gallery-title-muted">
                to Build &amp; Ship Effortlessly
              </span>
            </h2>
            <p className="features-v2-subtitle">
              Effortlessly create, optimize, and scale high-converting websites — no coding required.
            </p>
          </div>

          {/* Nav buttons live inside Carousel so we render them there */}
        </div>

        {/* Carousel */}
        <Carousel disableDrag={false}>
          <div className="features-gallery-controls-row">
            <NavButtons />
          </div>

          <CarouselContent className="features-gallery-track">
            {FEATURES.map((feat) => (
              <CarouselItem key={feat.id} className="features-gallery-slide">
                <Link to={feat.url} className="features-gallery-card-link group">
                  <Card className="features-gallery-card">
                    {/* Image — fills full card, shrinks on hover */}
                    <div className="features-gallery-img-wrap">
                      <img
                        src={feat.image}
                        alt={feat.title}
                        className="features-gallery-img"
                        loading="lazy"
                      />
                      {/* Fade overlay bottom */}
                      <div className="features-gallery-fade-overlay" />
                      {/* Feature number always visible over image */}
                      <span className="features-gallery-num">{feat.num}</span>
                    </div>

                    {/* Hover reveal panel */}
                    <div className="features-gallery-reveal">
                      <h3 className="features-gallery-reveal-title">{feat.title}</h3>
                      <p className="features-gallery-reveal-desc">{feat.summary}</p>
                      <div className="features-gallery-reveal-arrow" aria-hidden="true">
                        <ArrowRight size={16} />
                      </div>
                    </div>
                  </Card>
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  );
}
