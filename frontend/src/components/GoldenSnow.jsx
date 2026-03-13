import React, { useEffect, useRef } from 'react';

/**
 * GoldenSnow Component
 * Ported from a.html - A subtle, relaxing golden particle effect.
 */
const GoldenSnow = ({ zIndex = 0 }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let width, height, flakes = [];
        let animationFrameId;

        const init = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
            flakes = [];
            // Only 50 particles for a clean, non-overwhelming look
            for (let i = 0; i < 50; i++) {
                flakes.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    r: Math.random() * 2 + 1,
                    speed: Math.random() * 0.5 + 0.2 // Very slow movement
                });
            }
        };

        const draw = () => {
            ctx.clearRect(0, 0, width, height);

            // Golden style
            ctx.fillStyle = "rgba(255, 215, 0, 0.7)";
            ctx.shadowBlur = 8;
            ctx.shadowColor = "gold";

            ctx.beginPath();
            for (let i = 0; i < flakes.length; i++) {
                let f = flakes[i];
                ctx.moveTo(f.x, f.y);
                ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
            }
            ctx.fill();

            for (let i = 0; i < flakes.length; i++) {
                flakes[i].y += flakes[i].speed;
                // Loop back to top
                if (flakes[i].y > height) {
                    flakes[i].y = -10;
                    flakes[i].x = Math.random() * width;
                }
            }
            animationFrameId = requestAnimationFrame(draw);
        };

        window.addEventListener('resize', init);
        init();
        draw();

        return () => {
            window.removeEventListener('resize', init);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            id="snowCanvas"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: zIndex, // Behind content by default
                background: 'transparent'
            }}
        />
    );
};

export default GoldenSnow;
