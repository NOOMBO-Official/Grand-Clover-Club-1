import React, { useRef, useEffect, useState } from 'react';

interface ChromaKeyVideoProps {
  src: string;
  className?: string;
}

export const ChromaKeyVideo: React.FC<ChromaKeyVideoProps> = ({ src, className = '' }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState(false);
  const [crossOriginMode, setCrossOriginMode] = useState<'anonymous' | undefined>('anonymous');

  useEffect(() => {
    setError(false);
    setCrossOriginMode('anonymous');
  }, [src]);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    // Force playback if not playing, but ignore abort/not-supported errors gracefully
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(e => {
        // Suppress benign playback interruption errors
        if (e.name !== 'AbortError' && e.name !== 'NotSupportedError') {
           console.warn("Video play warning:", e);
        }
      });
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    let animationFrameId: number;

    const processFrame = () => {
      if (video.paused || video.ended || error) {
        animationFrameId = requestAnimationFrame(processFrame);
        return;
      }

      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      if (video.videoWidth > 0 && video.videoHeight > 0) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        try {
          const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = frame.data;
          const l = data.length / 4;
          
          for (let i = 0; i < l; i++) {
            const r = data[i * 4 + 0];
            const g = data[i * 4 + 1];
            const b = data[i * 4 + 2];
            
            // Chroma key condition for bright green screen
            if (g > 90 && g > r * 1.3 && g > b * 1.3) {
              data[i * 4 + 3] = 0; // Transparent
            } else if (g > 70 && g > r * 1.1 && g > b * 1.1) {
              data[i * 4 + 3] = 120; // Soft edge
            }
          }
          
          ctx.putImageData(frame, 0, 0);
        } catch (e) {
          console.error("Canvas read error (CORS):", e);
          setError(true);
        }
      }

      animationFrameId = requestAnimationFrame(processFrame);
    };

    animationFrameId = requestAnimationFrame(processFrame);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [error, crossOriginMode, src]);

  return (
    <div className={`pointer-events-none ${className}`}>
      {/* Hide the actual video with opacity/position instead of display:none to keep it rendering */}
      <video
        key={`${src}-${crossOriginMode || 'no-cors'}`}
        ref={videoRef}
        src={src}
        crossOrigin={crossOriginMode}
        onError={() => {
          if (crossOriginMode === 'anonymous') {
            console.warn("CORS error on video load, retrying without crossOrigin.");
            setCrossOriginMode(undefined);
            setError(true);
          }
        }}
        autoPlay
        muted
        loop
        playsInline
        className={error ? 'w-full h-full object-contain mix-blend-screen opacity-50' : 'absolute w-[1px] h-[1px] opacity-0 -z-10'}
      />
      {!error && (
        <canvas
          ref={canvasRef}
          className="w-full h-full object-contain"
        />
      )}
    </div>
  );
};
