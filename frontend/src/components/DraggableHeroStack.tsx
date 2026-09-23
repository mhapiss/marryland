import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const heroImages = [
  "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1606800052052-a08af7148866?q=80&w=800&auto=format&fit=crop"
];

interface Props {
  isDarkMode: boolean;
}

export const DraggableHeroStack: React.FC<Props> = ({ isDarkMode }) => {
  const [cards, setCards] = useState(heroImages);
  
  const cardBg = isDarkMode ? 'bg-[#2A3B2E]' : 'bg-white';
  const borderC = isDarkMode ? 'border-primary-800' : 'border-primary-100';

  const moveToEnd = (index: number) => {
    setCards(prev => {
      const newCards = [...prev];
      const card = newCards.splice(index, 1)[0];
      newCards.push(card);
      return newCards;
    });
  };

  return (
    <div className="relative w-full h-[400px] md:h-[500px] flex items-center justify-center">
      {cards.map((src, index) => {
        const isTop = index === 0;
        
        return (
          <motion.div
            key={src}
            layout
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{
              scale: 1 - index * 0.05,
              y: index * 12,
              rotate: index === 0 ? 0 : index % 2 === 0 ? 4 : -4,
              zIndex: cards.length - index,
              opacity: 1 - index * 0.15
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 20
            }}
            drag={isTop ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = Math.abs(offset.x) * velocity.x;
              if (swipe < -10000 || offset.x < -100 || offset.x > 100) {
                moveToEnd(0);
              }
            }}
            className={`absolute w-[280px] md:w-[340px] h-[360px] md:h-[440px] ${cardBg} p-3 rounded-3xl shadow-elevated border ${borderC} cursor-grab active:cursor-grabbing origin-bottom flex-none`}
          >
            <div className="w-full h-full rounded-2xl bg-primary-100/30 overflow-hidden pointer-events-none relative group">
              <img src={src} alt="Portfolio" className="w-full h-full object-cover" draggable="false" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            
            {/* Tooltip on top card indicating it's draggable */}
            {isTop && (
               <div className="absolute -left-6 md:-left-12 bottom-10 z-40 animate-float pointer-events-none">
                 <div className={`${cardBg} py-2 px-4 rounded-full shadow-card border ${borderC} flex items-center space-x-2 text-xs`}>
                   <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-300 to-primary flex items-center justify-center shrink-0">
                     <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                   </div>
                   <span className="font-semibold text-text whitespace-nowrap">Geser fotonya</span>
                 </div>
               </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};
