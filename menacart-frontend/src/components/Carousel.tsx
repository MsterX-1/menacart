import React, { useRef } from 'react';
import './Carousel.css';

interface CarouselProps {
  title?: string;
  children: React.ReactNode;
}

export const Carousel: React.FC<CarouselProps> = ({ title, children }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  return (
    <div className="carousel-section">
      {title && (
        <div className="carousel-header">
          <h2 className="carousel-title">{title}</h2>
          <div className="carousel-controls">
            <button onClick={scrollLeft} className="carousel-btn" aria-label="Scroll left">
              &lt;
            </button>
            <button onClick={scrollRight} className="carousel-btn" aria-label="Scroll right">
              &gt;
            </button>
          </div>
        </div>
      )}
      <div className="carousel-container" ref={scrollRef}>
        {children}
      </div>
    </div>
  );
};
