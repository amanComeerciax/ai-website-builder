import React, { useRef, useState } from 'react';

export default function SeamlessVideoLayer({ src, className, style, objectPosition = 'center' }) {
    const video1Ref = useRef(null);
    const video2Ref = useRef(null);
    const [active, setActive] = useState(1);
    const hasTriggeredSwap = useRef(false);

    const handleTimeUpdate = (e) => {
        const video = e.target;
        if (!video.duration) return;

        // When ~0.4s from the end, start the crossfade
        if (video.duration - video.currentTime <= 0.45) {
            if (!hasTriggeredSwap.current) {
                hasTriggeredSwap.current = true;
                
                const nextId = active === 1 ? 2 : 1;
                const nextVideo = nextId === 1 ? video1Ref.current : video2Ref.current;
                
                if (nextVideo) {
                    nextVideo.currentTime = 0;
                    nextVideo.play().catch(err => console.error("Seamless playback failed", err));
                }
                setActive(nextId);
            }
        }
        
        // Reset the trigger guard once the new video gains ground
        if (video.currentTime < 1.0) {
            hasTriggeredSwap.current = false;
        }
    };

    const baseStyle = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        objectPosition: objectPosition,
        pointerEvents: 'none',
        transition: 'opacity 0.45s linear', // Duration matches the crossfade threshold
        ...style
    };

    return (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
            {/* Pure black base plate prevents any flash-to-white behind the crossfade */}
            <div style={{ position: 'absolute', inset: 0, background: '#000', pointerEvents: 'none', zIndex: -1 }} />
            
            <video
                ref={video1Ref}
                className={className || "sp-video-bg"}
                src={src}
                autoPlay
                muted
                playsInline
                onTimeUpdate={active === 1 ? handleTimeUpdate : undefined}
                style={{
                    ...baseStyle,
                    opacity: active === 1 ? 0.8 : 0,
                    zIndex: active === 1 ? 2 : 1
                }}
            />
            <video
                ref={video2Ref}
                className={className || "sp-video-bg"}
                src={src}
                muted
                playsInline
                onTimeUpdate={active === 2 ? handleTimeUpdate : undefined}
                style={{
                    ...baseStyle,
                    opacity: active === 2 ? 0.8 : 0,
                    zIndex: active === 2 ? 2 : 1
                }}
            />
        </div>
    );
}
