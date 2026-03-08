import React from 'react';
import { motion } from 'framer-motion';
import { ROOT_CANVAS } from '../constants';

const LoadingScreen: React.FC = () => {
  return (
    <motion.div 
      className="fixed inset-0 z-[999] flex flex-col items-center justify-center pointer-events-none"
      style={{ backgroundColor: ROOT_CANVAS }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-neutral-200 border-t-neutral-800 animate-spin"></div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">加载中...推荐搭载梯子浏览</span>
      </div>
    </motion.div>
  );
};

export default LoadingScreen;
