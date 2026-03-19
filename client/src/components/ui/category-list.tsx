"use client";
import React, { useState } from 'react';

// Define the type for a single category item
export interface Category {
    id: string | number;
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    onClick?: () => void;
    featured?: boolean;
}

// Define the props for the CategoryList component
export interface CategoryListProps {
    title: string;
    subtitle?: string;
    categories: Category[];
    headerIcon?: React.ReactNode;
    className?: string;
}

export const CategoryList = ({
    title,
    subtitle,
    categories,
    headerIcon,
    className,
}: CategoryListProps) => {
    const [hovered, setHovered] = useState<string | number | null>(null);

    // The orange theme color from the app
    const themeColor = "#f97316"; // orange-500
    // Transparent orange for backgrounds
    const themeBgHover = "rgba(249, 115, 22, 0.1)"; // orange-500/10

    return (
        <div style={{
            color: "var(--text-main)",
            fontFamily: "system-ui, -apple-system, sans-serif",
            display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px",
            width: "100%"
        }} className={className}>
            <div style={{ width: "100%", maxWidth: "860px" }}>
                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: "48px" }}>
                    {headerIcon && (
                        <div style={{
                            display: "inline-flex", alignItems: "center", justifyContent: "center",
                            width: "64px", height: "64px", borderRadius: "50%",
                            background: "rgba(249, 115, 22, 0.2)", marginBottom: "20px",
                            color: themeColor
                        }}>
                            {headerIcon}
                        </div>
                    )}
                    <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 800, margin: "0 0 4px", lineHeight: 1.1 }}>
                        {title}
                    </h1>
                    {subtitle && (
                        <h2 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 800, margin: 0, color: "var(--text-muted)", lineHeight: 1.1, opacity: 0.5 }}>
                            {subtitle}
                        </h2>
                    )}
                </div>

                {/* List */}
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {categories.map((cat) => {
                        const isHovered = hovered === cat.id;
                        return (
                            <div
                                key={cat.id}
                                onMouseEnter={() => setHovered(cat.id)}
                                onMouseLeave={() => setHovered(null)}
                                onClick={cat.onClick}
                                style={{
                                    position: "relative",
                                    background: isHovered ? themeBgHover : "var(--glass-card)",
                                    border: isHovered ? `1px solid ${themeColor}` : "1px solid var(--glass-border)",
                                    borderRadius: "8px",
                                    padding: "0 28px",
                                    height: isHovered ? "120px" : "88px",
                                    display: "flex", alignItems: "center", justifyContent: "space-between",
                                    cursor: "pointer",
                                    transition: "all 0.3s ease",
                                    overflow: "hidden",
                                    boxShadow: isHovered ? `0 10px 30px -10px rgba(249, 115, 22, 0.3)` : "none"
                                }}
                            >
                                {/* Top-left bracket */}
                                {isHovered && (
                                    <>
                                        <div style={{ position: "absolute", top: "12px", left: "12px" }}>
                                            <div style={{ position: "absolute", top: 0, left: 0, width: "16px", height: "2px", background: themeColor }} />
                                            <div style={{ position: "absolute", top: 0, left: 0, width: "2px", height: "16px", background: themeColor }} />
                                        </div>
                                        <div style={{ position: "absolute", bottom: "12px", right: "12px" }}>
                                            <div style={{ position: "absolute", bottom: 0, right: 0, width: "16px", height: "2px", background: themeColor }} />
                                            <div style={{ position: "absolute", bottom: 0, right: 0, width: "2px", height: "16px", background: themeColor }} />
                                        </div>
                                    </>
                                )}

                                {/* Text */}
                                <div>
                                    <h3 style={{
                                        fontSize: cat.featured ? "1.6rem" : "1.25rem",
                                        fontWeight: 700, margin: "0 0 6px",
                                        color: isHovered ? themeColor : "var(--text-main)",
                                        transition: "color 0.3s",
                                    }}>
                                        {cat.title}
                                    </h3>
                                    {cat.subtitle && (
                                        <p style={{
                                            margin: 0, fontSize: "0.9rem",
                                            color: isHovered ? "var(--text-main)" : "var(--text-dim)",
                                            transition: "color 0.3s", maxWidth: "600px", lineHeight: 1.5,
                                        }}>
                                            {cat.subtitle}
                                        </p>
                                    )}
                                </div>

                                {/* Icon */}
                                <div style={{
                                    opacity: isHovered ? 1 : 0,
                                    transition: "all 0.3s ease",
                                    color: themeColor, flexShrink: 0, marginLeft: "16px",
                                    transform: isHovered ? "translateX(0)" : "translateX(-10px)",
                                }}>
                                    {cat.icon}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
