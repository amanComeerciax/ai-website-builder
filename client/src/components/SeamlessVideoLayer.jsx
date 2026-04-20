import React, { useRef, useEffect } from 'react';

export default function SeamlessVideoLayer({ src, className, style, objectPosition = 'center' }) {
    const videoRef = useRef(null);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        let animationFrameId;

        const checkLoop = () => {
            // Cut the video 0.15s before the very end. The exact tail of an MP4 often contains 
            // an empty black frame depending on encoding. Snapping back slightly early 
            // yields a perfectly smooth loop without double-render decoding overhead.
            if (video.duration && video.currentTime >= video.duration - 0.15) {
                // By starting slightly past 0 (e.g. 0.05) we visually bypass frame 1 if it's lagging
                video.currentTime = 0.05; 
            }
            animationFrameId = requestAnimationFrame(checkLoop);
        };

        const onPlay = () => {
            animationFrameId = requestAnimationFrame(checkLoop);
        };

        const onPause = () => {
            cancelAnimationFrame(animationFrameId);
        };

        video.addEventListener('play', onPlay);
        video.addEventListener('pause', onPause);

        // If autoPlay already triggered before listener hooked
        if (!video.paused) {
            onPlay();
        }

        return () => {
            cancelAnimationFrame(animationFrameId);
            video.removeEventListener('play', onPlay);
            video.removeEventListener('pause', onPause);
        };
    }, []);

    const baseStyle = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        objectPosition: objectPosition,
        pointerEvents: 'none',
        ...style
    };

    return (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
            <video
                ref={videoRef}
                className={className || "sp-video-bg"}
                src={src}
                autoPlay
                muted
                playsInline
                disablePictureInPicture
                style={baseStyle}
            />
        </div>
    );
}
