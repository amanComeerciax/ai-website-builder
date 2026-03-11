import { Moon, Sun, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../stores/useThemeStore';

const ACCENTS = [
    { id: 'orange', color: '#f97316', label: 'Amber' },
    { id: 'blue', color: '#3b82f6', label: 'Ocean' },
    { id: 'purple', color: '#8b5cf6', label: 'Royal' },
    { id: 'green', color: '#10b981', label: 'Forest' },
];

export default function ThemePicker() {
    const { theme, accent, setAccent, toggleTheme } = useTheme();

    return (
        <div className="flex items-center gap-3 px-3 py-1.5 bg-[var(--border-subtle)] border border-[var(--glass-border)] rounded-full backdrop-blur-md">
            {/* Mode Toggle */}
            <button
                onClick={toggleTheme}
                className="p-1.5 rounded-full hover:bg-[var(--glass-card)] transition-colors text-[var(--text-dim)] hover:text-[var(--text-main)]"
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
                <motion.div
                    initial={false}
                    animate={{ rotate: theme === 'dark' ? 0 : 180, scale: [0.8, 1.1, 1] }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                >
                    {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                </motion.div>
            </button>

            <div className="w-[1px] h-4 bg-[var(--glass-border)]" />

            {/* Accent Picker */}
            <div className="flex items-center gap-1.5">
                {ACCENTS.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setAccent(item.id)}
                        className="relative p-1 group"
                        title={`${item.label} accent`}
                    >
                        <div 
                            className="w-3.5 h-3.5 rounded-full transition-transform duration-300 group-hover:scale-125"
                            style={{ 
                                backgroundColor: item.color,
                                boxShadow: accent === item.id ? `0 0 10px ${item.color}66` : 'none',
                                opacity: accent === item.id ? 1 : 0.6
                            }}
                        />
                        {accent === item.id && (
                            <motion.div
                                layoutId="active-accent"
                                className="absolute inset-0 border border-[var(--text-main)] rounded-full opacity-20"
                                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                            />
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
