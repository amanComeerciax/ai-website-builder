"use client";
import React, { useState } from "react";
import {
    motion,
    AnimatePresence,
    useScroll,
    useMotionValueEvent,
} from "framer-motion";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

export const FloatingNav = ({
    navItems,
    className,
}: {
    navItems: {
        name: string;
        link: string;
        icon?: React.ReactNode;
    }[];
    className?: string;
}) => {
    const { scrollYProgress } = useScroll();
    const [visible, setVisible] = useState(true);

    useMotionValueEvent(scrollYProgress, "change", (current) => {
        if (typeof current === "number") {
            const direction = current - (scrollYProgress.getPrevious() ?? 0);

            if (scrollYProgress.get() < 0.05) {
                setVisible(true);
            } else {
                if (direction < 0) {
                    setVisible(true);
                } else {
                    setVisible(false);
                }
            }
        }
    });

    return (
        <AnimatePresence mode="wait">
            <motion.div
                initial={{
                    opacity: 1,
                    y: 0,
                }}
                animate={{
                    y: visible ? 0 : -100,
                    opacity: visible ? 1 : 0,
                }}
                transition={{
                    duration: 0.25,
                    ease: "easeInOut",
                }}
                className={cn(
                    "flex max-w-fit fixed top-6 inset-x-0 mx-auto rounded-full z-[5000] px-1.5 py-1.5 items-center justify-center space-x-1",
                    "bg-white/10 backdrop-blur-xl border border-white/20",
                    "shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.2)]",
                    className
                )}
            >
                {navItems.map((navItem, idx) => (
                    <Link
                        key={`nav-${idx}`}
                        to={navItem.link}
                        className="relative flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200"
                    >
                        <span className="block sm:hidden">{navItem.icon}</span>
                        <span className="hidden sm:block">{navItem.name}</span>
                    </Link>
                ))}
                <Link
                    to="/dashboard"
                    className="relative flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-semibold bg-white text-gray-900 hover:bg-white/90 transition-all duration-200 shadow-sm"
                >
                    <span>Get Started</span>
                </Link>
            </motion.div>
        </AnimatePresence>
    );
};
