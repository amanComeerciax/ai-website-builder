/**
 * ClientsSection — scroll-stacking testimonial cards
 * Uses framer-motion useScroll + useTransform to manually animate
 * card positions — works correctly with Lenis smooth scroll.
 */
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Star, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────────
export interface Stat { value: string; label: string; }
export interface Testimonial {
  name: string; title: string; company: string;
  quote: string; avatarSrc: string; rating: number;
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const STATS: Stat[] = [
  { value: "2,400+", label: "Websites built"    },
  { value: "98%",    label: "Satisfaction rate" },
  { value: "4.9★",   label: "Average rating"   },
];

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Sarah Chen",
    title: "Founder", company: "NexaFlow SaaS",
    quote: "I launched my entire SaaS landing page in 18 minutes. I described what I wanted, and IndiForge built it — React code, API routes, the works. It's genuinely magical.",
    avatarSrc: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80&auto=format&fit=crop",
    rating: 5.0,
  },
  {
    name: "Marcus Webb",
    title: "Head of Growth", company: "Orbit Analytics",
    quote: "We cut our front-end prototyping time by 80%. The AI understands design intent, not just code — it generated pixel-perfect components that matched our brand instantly.",
    avatarSrc: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80&auto=format&fit=crop",
    rating: 4.9,
  },
  {
    name: "Priya Sharma",
    title: "CEO", company: "Bloom E-Commerce",
    quote: "My store went from idea to live in one afternoon. The AI picked the perfect template, customized it to my brand, and deployed — I didn't write a single line of code.",
    avatarSrc: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&q=80&auto=format&fit=crop",
    rating: 5.0,
  },
];

// ─── Animated card — slides in from bottom and stacks ─────────────────────────
function AnimatedCard({
  testimonial, index, containerRef, total,
}: {
  testimonial: Testimonial;
  index: number;
  containerRef: React.RefObject<HTMLDivElement>;
  total: number;
}) {
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  // Each card enters sequentially based on scroll progress
  const segmentSize = 1 / total;
  const start = index * segmentSize * 0.6;
  const end = start + segmentSize * 0.8;

  // Card translates up from below as scroll progresses
  const y = useTransform(scrollYProgress, [start, end], ["80px", "0px"]);
  const opacity = useTransform(scrollYProgress, [start, start + 0.05], [0, 1]);
  // Cards behind get slightly scaled down so the stack "depth" is visible
  const scale = useTransform(
    scrollYProgress,
    [end, 1],
    [1, 1 - (total - index - 1) * 0.025]
  );

  return (
    <motion.div
      style={{ y, opacity, scale, position: "relative", zIndex: index + 1 }}
      className="testimonial-anim-card"
    >
      <div className={cn("testimonial-card-inner", `testimonial-card-depth-${index}`)}>
        {/* Header */}
        <div className="testimonial-card-header">
          <div
            className="testimonial-avatar"
            style={{ backgroundImage: `url(${testimonial.avatarSrc})` }}
            aria-label={`Photo of ${testimonial.name}`}
          />
          <div>
            <p className="testimonial-name">{testimonial.name}</p>
            <p className="testimonial-title">{testimonial.title} · {testimonial.company}</p>
          </div>
        </div>

        {/* Stars */}
        <div className="testimonial-stars">
          <span className="testimonial-rating-num">{testimonial.rating.toFixed(1)}</span>
          <div className="testimonial-stars-row">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "testimonial-star",
                  i < Math.floor(testimonial.rating)
                    ? "testimonial-star-filled"
                    : "testimonial-star-empty"
                )}
              />
            ))}
          </div>
        </div>

        {/* Quote */}
        <p className="testimonial-quote">&ldquo;{testimonial.quote}&rdquo;</p>
      </div>
    </motion.div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────
export function ClientsSection() {
  const containerRef = useRef<HTMLDivElement>(null!);

  return (
    <section className="clients-section" ref={containerRef}>
      <div className="clients-inner">

        {/* Left — sticky */}
        <div className="clients-left">
          <div className="clients-badge">
            <span className="clients-badge-dot" />
            <span>100% Satisfaction Guaranteed</span>
          </div>

          <h2 className="clients-title">
            Builders{" "}
            <span className="clients-title-accent">Love</span>
            <br />IndiForge
          </h2>

          <p className="clients-desc">
            Trusted by 2,400+ founders, developers, and teams who ship faster
            with AI-powered website generation. Real results, real people.
          </p>

          <div className="clients-stats-grid">
            {STATS.map((s) => (
              <div key={s.label} className="clients-stat-card">
                <p className="testimonial-stat-value">{s.value}</p>
                <p className="testimonial-stat-label">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="clients-cta-row">
            <Link to="/signup" className="clients-cta-primary">
              Start Building Free <ArrowRight size={15} />
            </Link>
            <a href="#how-it-works" className="clients-cta-ghost">
              See How It Works
            </a>
          </div>
        </div>

        {/* Right — scroll-animated stacking cards */}
        <div className="clients-right">
          {TESTIMONIALS.map((t, i) => (
            <AnimatedCard
              key={t.name}
              testimonial={t}
              index={i}
              containerRef={containerRef}
              total={TESTIMONIALS.length}
            />
          ))}
        </div>

      </div>
    </section>
  );
}

export default ClientsSection;
