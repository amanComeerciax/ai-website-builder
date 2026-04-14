import React from 'react';

export default function SeamlessVideoLayer({ src, className, style }) {
    return (
        <video
            className={className || "sp-video-bg"}
            src={src}
            autoPlay
            muted
            loop
            playsInline
            style={{ 
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                zIndex: 0,
                pointerEvents: 'none',
                opacity: 0.8, // Slightly dimmed to match the previous elegant theme
                ...style 
            }}
        />
    );
}
