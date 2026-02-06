import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Tooltip({ children, content, side = 'top', align = 'center' }) {
  const [isVisible, setIsVisible] = useState(false);

  // Position logic
  const getPosition = () => {
    switch (side) {
      case 'top': return { bottom: '100%', left: '50%', x: '-50%', marginBottom: '8px' };
      case 'bottom': return { top: '100%', left: '50%', x: '-50%', marginTop: '8px' };
      case 'left': return { right: '100%', top: '20%', y: '-50%', marginRight: '8px' };
      case 'right': return { left: '100%', top: '20%', y: '-50%', marginLeft: '8px' };
      default: return { bottom: '100%', left: '50%', x: '-50%', marginBottom: '8px' };
    }
  };

  return (
    <div 
      className="relative flex items-center justify-center w-full" 
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      
      <AnimatePresence>
        {isVisible && content && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 px-3 py-1.5 w-max max-w-48 whitespace-normal text-center text-[10px] bg-game-text text-game-card font-bold pixel-text uppercase rounded-sm shadow-[0px_2px_0px_0px_rgba(0,0,0,1)] pointer-events-none"
            style={getPosition()}
          >
            {content}
            <div 
              className="absolute w-2 h-2 bg-game-text rotate-45 transform"
              style={{
                // Vertical positioning (for top/bottom)
                bottom: side === 'top' ? '-3px' : 'auto',
                top: side === 'bottom' ? '-3px' : (side === 'left' || side === 'right' ? '50%' : 'auto'),
                
                // Horizontal positioning (for left/right)
                left: side === 'right' ? '-3px' : (side === 'top' || side === 'bottom' ? '50%' : 'auto'),
                right: side === 'left' ? '-3px' : 'auto',
                
                // Centering adjustments
                marginLeft: (side === 'top' || side === 'bottom') ? '-4px' : '0',
                marginTop: (side === 'left' || side === 'right') ? '-4px' : '0'
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
