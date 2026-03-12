"use client";
import { useState } from "react";

const defaultItems = [
  { id: "01", title: "How does the AI work?", content: "Our AI analyzes your prompt and generates production-ready React components with Tailwind CSS styling. It understands design patterns, layouts, and best practices to deliver clean, functional code instantly." },
  { id: "02", title: "Can I edit the generated code?", content: "Absolutely. All generated code is fully editable. You get clean, readable source files that you can customize, extend, or integrate into your existing codebase without any lock-in." },
  { id: "03", title: "Do I need to know how to code?", content: "Not at all. IndiForge AI is designed for everyone — from non-technical founders to experienced developers. Just describe what you want in plain English and we handle the rest." },
  { id: "04", title: "Is the output responsive?", content: "Yes, every component and page generated is fully responsive by default. We use Tailwind CSS utility classes to ensure your UI looks great on mobile, tablet, and desktop." },
  { id: "05", title: "Can I use my own domain?", content: "Yes. When you deploy through IndiForge AI, you can connect a custom domain in just a few clicks. We support all major domain registrars and provide SSL certificates automatically." },
  { id: "06", title: "What tech stack is used?", content: "We generate modern web standards: React, Tailwind CSS, Lucide icons, and Framer Motion for animations. It's built to be fast, scalable, and clean." },
  { id: "07", title: "Is there a free plan?", content: "Yes, we offer a generous free tier so you can explore IndiForge AI without a credit card. Upgrade anytime to unlock more generations, private projects, and priority support." },
  { id: "08", title: "How do I get support?", content: "You can reach our team via the in-app chat, our Discord community, or by emailing support@indiforge.ai. We typically respond within a few hours on business days." },
];

export interface AccordionItemType {
  id: string;
  title: string;
  content: string;
}

export interface Accordion05Props {
  items?: AccordionItemType[];
  className?: string;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
}

export function Accordion05({ 
  items = defaultItems, 
  className, 
  title = <>Frequently<br />Asked<br />Questions</>, 
  subtitle = "Everything you need to know about building with IndiForge AI."
}: Accordion05Props) {
  const [open, setOpen] = useState<string | null>(items.length > 0 ? items[0].id : "07");

  return (
    <div style={{
      color: "#fff",
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    }} className={`w-full relative z-10 py-12 md:py-24 ${className || ""}`}>
      {/* Outer container — centers everything and caps max width */}
      <div style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "0 48px",
        display: "flex",
        gap: "80px",
        alignItems: "flex-start",
      }} className="flex-col lg:flex-row">

        {/* ── LEFT COLUMN: sticky title block ── */}
        <div style={{
          flex: "0 0 280px",
          position: "sticky",
          top: "120px",
        }}>
          <h1 style={{
            fontSize: "clamp(2.4rem, 4vw, 3.6rem)",
            fontWeight: 900,
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
            margin: "0 0 20px",
          }}>
            {title}
          </h1>
          <p style={{
            fontSize: "0.95rem",
            lineHeight: 1.65,
            color: "rgba(255,255,255,0.4)",
            margin: 0,
            maxWidth: "220px",
          }}>
            {subtitle}
          </p>
        </div>

        {/* ── RIGHT COLUMN: accordion ── */}
        <div style={{ flex: 1, minWidth: 0, width: "100%" }}>
          {items.map((item) => {
            const isOpen = open === item.id;
            return (
              <div
                key={item.id}
                style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : item.id)}
                  style={{
                    width: "100%",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "22px 0",
                    display: "flex",
                    alignItems: "center",
                    gap: "20px",
                    textAlign: "left",
                    outline: "none"
                  }}
                >
                  {/* Number */}
                  <span style={{
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                    minWidth: "22px",
                    color: isOpen ? "#f97316" : "rgba(255,255,255,0.25)",
                    transition: "color 0.2s",
                    alignSelf: "flex-start",
                    paddingTop: "4px",
                    fontVariantNumeric: "tabular-nums"
                  }}>
                    {item.id}
                  </span>

                  {/* Title */}
                  <h2 style={{
                    margin: 0,
                    fontSize: "clamp(1rem, 2vw, 1.35rem)",
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: isOpen ? "#ffffff" : "rgba(255,255,255,0.28)",
                    transition: "color 0.25s ease",
                    lineHeight: 1.2,
                  }}>
                    {item.title}
                  </h2>
                </button>

                {/* Expandable content */}
                <div style={{
                  overflow: "hidden",
                  maxHeight: isOpen ? "300px" : "0",
                  transition: "max-height 0.35s cubic-bezier(0.4,0,0.2,1)",
                }}>
                  <p style={{
                    margin: 0,
                    padding: "0 0 28px 42px",
                    fontSize: "0.95rem",
                    lineHeight: 1.75,
                    color: "rgba(255,255,255,0.5)",
                  }}>
                    {item.content}
                  </p>
                </div>
              </div>
            );
          })}
          {/* Bottom border */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }} />
        </div>

      </div>
    </div>
  );
}
