import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Pagination, Navigation, Autoplay } from 'swiper/modules';
import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

import './ScreenshotGallery.css';

interface ScreenshotGalleryProps {
  screenshots: string[];
}

const ScreenshotGallery: React.FC<ScreenshotGalleryProps> = ({ screenshots }) => {
  const { t } = useTranslation();
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  if (!screenshots || screenshots.length === 0) return null;

  return (
    <div className="screenshot-gallery-container relative w-full py-12 group">
      {/* Custom Navigation Buttons */}
      <button 
        ref={prevRef}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 hover:scale-110 transition-all duration-300 opacity-0 group-hover:opacity-100 focus:outline-none shadow-lg"
        aria-label="Previous slide"
      >
        <ChevronLeft size={24} />
      </button>
      
      <button 
        ref={nextRef}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 hover:scale-110 transition-all duration-300 opacity-0 group-hover:opacity-100 focus:outline-none shadow-lg"
        aria-label="Next slide"
      >
        <ChevronRight size={24} />
      </button>

      <Swiper
        effect={'coverflow'}
        grabCursor={true}
        centeredSlides={true}
        slidesPerView={'auto'}
        coverflowEffect={{
          rotate: 0,
          stretch: 0,
          depth: 100,
          modifier: 2.5,
          slideShadows: true,
        }}
        pagination={{ 
          clickable: true,
          dynamicBullets: true,
        }}
        navigation={{
          prevEl: prevRef.current,
          nextEl: nextRef.current,
        }}
        onBeforeInit={(swiper) => {
          // @ts-expect-error Swiper types allow nav elements assignment at runtime
          swiper.params.navigation.prevEl = prevRef.current;
          // @ts-expect-error Swiper types allow nav elements assignment at runtime
          swiper.params.navigation.nextEl = nextRef.current;
        }}
        loop={screenshots.length > 2} // Only loop if enough slides
        autoplay={{
          delay: 3000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        observer={true}
        observeParents={true}
        modules={[EffectCoverflow, Pagination, Navigation, Autoplay]}
        className="mySwiper w-full !pb-14"
      >
        {screenshots.map((screenshot, index) => (
          <SwiperSlide key={index} className="swiper-slide-custom">
             <div className="slide-content relative w-full h-full rounded-2xl overflow-hidden shadow-2xl transition-all duration-500 bg-slate-900">
              <img 
                src={screenshot} 
                alt={`Screenshot ${index + 1}`} 
                className="w-full h-full object-cover block select-none"
                draggable={false}
              />
              
              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              
              {/* Action Button */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                <button 
                  className="bg-white/20 backdrop-blur-md border border-white/30 text-white px-5 py-2.5 rounded-full flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 hover:bg-white/30"
                  onClick={() => window.open(screenshot, '_blank')}
                >
                  <Maximize2 size={16} />
                  <span className="font-medium text-sm">{t('productDetail.viewFull')}</span>
                </button>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default ScreenshotGallery;
