import React, { useState, useRef, useEffect } from 'react';

// A high-quality academic/service themed placeholder
const FALLBACK_SERVICE_IMAGE = "https://images.unsplash.com/photo-1434031213662-874396ea9cc1?auto=format&fit=crop&q=80&w=400";

const ServiceCard = ({ service, onClick }) => {
    const [bgColor, setBgColor] = useState('#f5f5f5'); 
    const imgRef = useRef();
    const [isReady, setIsReady] = useState(false);

    const extractColor = () => {
        try {
            const img = imgRef.current;
            // Ensure we don't try to process if the image isn't valid
            if (!img || !img.complete || img.naturalWidth === 0) return;

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

            const colorCounts = {};
            let maxCount = 0;
            let dominantR = 245, dominantG = 245, dominantB = 245;

            for (let i = 0; i < imageData.length; i += 4) {
                const r = imageData[i];
                const g = imageData[i + 1];
                const b = imageData[i + 2];
                const a = imageData[i + 3];

                if (a < 128) continue; 
                if (r < 80 && g < 80 && b < 80) continue; 
                if (r > 240 && g > 240 && b > 240) continue; 

                const rBucket = Math.round(r / 15) * 15;
                const gBucket = Math.round(g / 15) * 15;
                const bBucket = Math.round(b / 15) * 15;
                const key = `${rBucket},${gBucket},${bBucket}`;

                colorCounts[key] = (colorCounts[key] || 0) + 1;

                if (colorCounts[key] > maxCount) {
                    maxCount = colorCounts[key];
                    dominantR = r; 
                    dominantG = g;
                    dominantB = b;
                }
            }

            if (maxCount > 0) {
                const mix = 0.50; 
                const finalR = Math.floor(dominantR * (1 - mix) + 255 * mix);
                const finalG = Math.floor(dominantG * (1 - mix) + 255 * mix);
                const finalB = Math.floor(dominantB * (1 - mix) + 255 * mix);

                setBgColor(`rgb(${finalR}, ${finalG}, ${finalB})`);
                setIsReady(true);
            }
        } catch (err) {
            console.log("Canvas extraction skipped.");
            // Even if extraction fails, show the card with fallback color
            setIsReady(true); 
        }
    };

    useEffect(() => {
        if (imgRef.current && imgRef.current.complete) {
            extractColor();
        }
    }, []);

    const handleImageError = (e) => {
        // Prevent infinite loops if the fallback itself fails
        if (e.target.src !== FALLBACK_SERVICE_IMAGE) {
            e.target.src = FALLBACK_SERVICE_IMAGE;
            // The onLoad will trigger again for the fallback image 
            // allowing us to extract the color from the placeholder!
        }
    };

    return (
        <div 
            className="serviceCard" 
            style={{ 
                backgroundColor: bgColor,
                opacity: isReady ? 1 : 0, 
                transform: isReady ? 'translateY(0)' : 'translateY(10px)',
                transition: 'opacity 0.4s ease, transform 0.4s ease, background-color 0.4s ease'
            }}
        >
            <div className="serviceText">
                <h3>{service.name}</h3>
                <p>{service.description}</p>
                <button className="scheduleBtn" onClick={onClick}>
                    {service.requiresScheduling ? "Schedule Appointment" : "Submit Request"}
                </button>
            </div>

            <div className="serviceImageWrapper">
                <img
                    ref={imgRef}
                    // Logic: 
                    // 1. If no image string, use Fallback.
                    // 2. If it's a full URL (http), use it as is.
                    // 3. If it's a relative path (/uploads), prepend the API URL.
                    src={
                        !service.image 
                            ? FALLBACK_SERVICE_IMAGE 
                            : service.image.startsWith('http') 
                                ? service.image 
                                : `${import.meta.env.VITE_API_URL}${service.image}`
                    }
                    alt={service.name}
                    className="serviceImage"
                    crossOrigin="anonymous" 
                    onLoad={extractColor} 
                    onError={handleImageError}
                />
            </div>
        </div>
    );
};

export default ServiceCard;