"use client";
import React, { useState } from 'react';
import { cn } from '@/lib/utils';

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
    const [hoveredItem, setHoveredItem] = useState<string | number | null>(null);

    return (
        <div className={cn("w-full flex justify-center bg-background text-foreground p-8", className)}>
            <div className="w-full max-w-5xl flex flex-col items-center">
                {/* Header Section */}
                <div className="text-center w-full mb-16 md:mb-24">
                    {headerIcon && (
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-orange-500/80 to-orange-500 mb-6 text-white shadow-lg shadow-orange-500/20">
                            {headerIcon}
                        </div>
                    )}
                    <h1 className="text-4xl md:text-5xl font-bold mb-2 tracking-tight">{title}</h1>
                    {subtitle && (
                        <h2 className="text-4xl md:text-5xl font-bold text-muted-foreground">{subtitle}</h2>
                    )}
                </div>

                {/* Categories List */}
                <div className="flex flex-col items-center justify-center space-y-4 w-full">
                    {categories.map((category) => (
                        <div
                            key={category.id}
                            className="relative group w-full"
                            onMouseEnter={() => setHoveredItem(category.id)}
                            onMouseLeave={() => setHoveredItem(null)}
                            onClick={category.onClick}
                        >
                            <div
                                className={cn(
                                    "relative overflow-hidden border bg-card transition-all duration-300 ease-in-out cursor-pointer w-full flex flex-col justify-center",
                                    // Hover state styles with orange instead of blue/primary
                                    hoveredItem === category.id
                                        ? 'h-32 border-orange-500 shadow-xl shadow-orange-500/20 bg-orange-500/5'
                                        : 'h-24 border-border hover:border-orange-500/50'
                                )}
                            >
                                {/* Corner brackets that appear on hover */}
                                {hoveredItem === category.id && (
                                    <>
                                        <div className="absolute top-3 left-3 w-6 h-6">
                                            <div className="absolute top-0 left-0 w-4 h-0.5 bg-orange-500" />
                                            <div className="absolute top-0 left-0 w-0.5 h-4 bg-orange-500" />
                                        </div>
                                        <div className="absolute bottom-3 right-3 w-6 h-6">
                                            <div className="absolute bottom-0 right-0 w-4 h-0.5 bg-orange-500" />
                                            <div className="absolute bottom-0 right-0 w-0.5 h-4 bg-orange-500" />
                                        </div>
                                    </>
                                )}

                                {/* Content - Left Aligned text, Icon on Right (giving it a gap) */}
                                <div className="flex items-center justify-between h-full px-12 md:px-20">
                                    <div className="flex-1 text-left">
                                        <h3
                                            className={cn(
                                                "font-bold transition-colors duration-300",
                                                category.featured ? 'text-2xl md:text-3xl' : 'text-xl md:text-2xl',
                                                hoveredItem === category.id ? 'text-orange-500' : 'text-foreground'
                                            )}
                                        >
                                            {category.title}
                                        </h3>
                                        {category.subtitle && (
                                            <p
                                                className={cn(
                                                    "mt-1 transition-colors duration-300 text-sm md:text-base",
                                                    hoveredItem === category.id ? 'text-foreground/90' : 'text-muted-foreground'
                                                )}
                                            >
                                                {category.subtitle}
                                            </p>
                                        )}
                                    </div>

                                    {/* Icon appears on the right on hover */}
                                    {category.icon && hoveredItem === category.id && (
                                        <div className="text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ml-6">
                                            {category.icon}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
