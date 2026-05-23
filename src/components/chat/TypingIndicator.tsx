import React from 'react';
import { motion } from 'framer-motion';

export const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-center space-x-1 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg w-16 h-8">
      {[0, 1, 2].map((dot) => (
        <motion.div
          key={dot}
          className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full"
          animate={{ y: [0, -4, 0] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: dot * 0.15,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
};
