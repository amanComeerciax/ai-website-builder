"use client";

import React, { useState, createContext, useContext, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";

export type ToastVariant = "success" | "error" | "warning" | "info" | "destructive" | "neutral";

export interface ToastData {
    id: string;
    title?: string;
    variant: ToastVariant;
    icon?: React.ReactNode;
    duration?: number;
    actionLabel?: string;
}

interface ToastContextType {
    toast: (props: Omit<ToastData, "id">) => void;
    dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const getTone = (variant: ToastVariant) => {
    switch (variant) {
        case "success": return "text-emerald-500";
        case "error": return "text-rose-500";
        case "warning": return "text-amber-500";
        case "info": return "text-blue-500";
        case "destructive": return "text-red-600";
        default: return "text-neutral-100";
    }
};

const ToastItem = ({ t, onDismiss }: { t: ToastData; onDismiss: (id: string) => void }) => {
    const tone = getTone(t.variant);
    const icon = t.icon || <Zap size={16} />;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="pointer-events-auto w-fit max-w-fit"
        >
            <div className="w-fit mx-auto min-w-[300px] bg-black border border-neutral-800 rounded-full py-2 pl-2 pr-4 flex items-center gap-3 shadow-xl">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-neutral-800 ${tone}`}>
                    {icon}
                </div>
                <span className="text-sm font-medium text-white flex-1">{t.title}</span>
                {t.actionLabel && (
                    <button className="text-xs font-bold text-white bg-neutral-700 px-3 py-1 rounded-full hover:bg-neutral-600 transition-colors">
                        {t.actionLabel}
                    </button>
                )}
            </div>
        </motion.div>
    );
};

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
    const [toasts, setToasts] = useState<ToastData[]>([]);

    const dismiss = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const toast = useCallback((props: Omit<ToastData, "id">) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, ...props }]);
        if (props.duration !== 0) {
            setTimeout(() => {
                dismiss(id);
            }, props.duration || 4000);
        }
    }, [dismiss]);

    return (
        <ToastContext.Provider value={{ toast, dismiss }}>
            {children}
            <div className="fixed z-[99999] flex flex-col gap-3 items-end p-6 pointer-events-none bottom-6 right-6">
                <AnimatePresence mode="popLayout">
                    {toasts.map((t) => (
                        <ToastItem key={t.id} t={t} onDismiss={dismiss} />
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be used within ToastProvider");
    return ctx;
};

const DemoButton = () => {
    const { toast } = useToast();

    return (
        <button
            onClick={() => toast({
                title: "AirPods Connected",
                variant: "neutral",
                duration: 3000,
                icon: <Zap size={16} />,
                actionLabel: "View"
            })}
            className="px-6 py-3 bg-black border border-white/20 hover:border-white/40 text-white rounded-lg font-medium transition-colors"
        >
            Show Pill Toast
        </button>
    );
}

export default function ToastPill() {
    return (
        <ToastProvider>
            <div className="w-full h-full flex items-center justify-center">
                <DemoButton />
            </div>
        </ToastProvider>
    );
}
