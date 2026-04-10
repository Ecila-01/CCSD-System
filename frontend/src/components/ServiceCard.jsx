import React, { useState, useRef, useEffect } from 'react';

const ServiceCard = ({ service, onClick }) => {
    const [bgColor, setBgColor] = useState('#f5f5f5'); // Fallback gray
    const imgRef = useRef();
    const [isReady, setIsReady] = useState(false);

    const extractColor = () => {
        console.log(service)
        try {
        const img = imgRef.current;
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

        // The Native Smart Filter + Dominant Bucket System
        for (let i = 0; i < imageData.length; i += 4) {
            const r = imageData[i];
            const g = imageData[i + 1];
            const b = imageData[i + 2];
            const a = imageData[i + 3];

            // 1. Skip transparent, dark (suits/hair), and white (backgrounds)
            if (a < 128) continue; 
            if (r < 80 && g < 80 && b < 80) continue; 
            if (r > 240 && g > 240 && b > 240) continue; 

            // 2. Group similar colors into "buckets" (rounding to the nearest 15)
            // This stops slightly different shades of pink from splitting the vote!
            const rBucket = Math.round(r / 15) * 15;
            const gBucket = Math.round(g / 15) * 15;
            const bBucket = Math.round(b / 15) * 15;
            const key = `${rBucket},${gBucket},${bBucket}`;

            colorCounts[key] = (colorCounts[key] || 0) + 1;

            // 3. Keep track of the most popular color bucket
            if (colorCounts[key] > maxCount) {
            maxCount = colorCounts[key];
            // Save the actual pixel color that won
            dominantR = r; 
            dominantG = g;
            dominantB = b;
            }
        }

        // 4. Mix the winning vibrant color with 50% white (down from 60%)
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
        }
    };

    useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
        extractColor();
    }
    }, []);

    return (
    <div 
    className="serviceCard" 
    style={{ 
        backgroundColor: bgColor,
        opacity: isReady ? 1 : 0, 
        transform: isReady ? 'translateY(0)' : 'translateY(10px)', // Optional: Adds a slight upward slide
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
        src={service.image}
        alt={service.name}
        className="serviceImage"
        crossOrigin="anonymous" 
        onLoad={extractColor} 
        onError={(e) => { e.target.src = 'https://via.placeholder.com/150'; }}
    />
    </div>
    </div>
    );
};

export default ServiceCard;