import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HeroSection: React.FC = () => {
  const navigate = useNavigate();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });

  // Parallax effect for background image
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  // Fade out text on scroll
  const textOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section ref={ref} className="relative h-screen w-full flex items-center justify-center overflow-hidden bg-black">
      {/* Immersive Edge-to-Edge Image */}
      <motion.div 
        style={{ y: backgroundY }}
        className="absolute inset-0 z-0 w-full h-[120%]"
      >
        <img 
          src="https://images.unsplash.com/photo-1459865264687-595d652de67e?q=80&w=2500" 
          alt="Stadium Lights Immersive"
          className="w-full h-full object-cover opacity-70"
        />
        {/* Lớp phủ đen tĩnh (Solid Overlay) để đảm bảo chữ nổi bật thay vì Gradient */}
        <div className="absolute inset-0 bg-black/40" />
      </motion.div>

      {/* Minimalist Text Center */}
      <motion.div 
        style={{ opacity: textOpacity }}
        className="relative z-10 text-center px-6 max-w-5xl"
      >
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="text-[4rem] md:text-[6rem] lg:text-[7rem] font-bold text-white leading-tight mb-6 drop-shadow-2xl"
        >
          Thỏa sức <br />
          <span className="text-primary">đam mê</span>
        </motion.h1>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="flex justify-center"
        >
          <button 
            onClick={() => navigate('/explore')} 
            className="flex items-center gap-4 text-white text-xl md:text-2xl font-medium group"
          >
            Bắt đầu khám phá 
            <div className="w-12 h-12 rounded-full border border-white/30 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all duration-300">
              <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
