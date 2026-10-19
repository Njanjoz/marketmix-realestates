// src/components/LoadingSpinner.jsx
import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { House, KeyRound, Sparkles } from 'lucide-react';

const LoadingSpinner = () => {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-gradient-to-b from-emerald-50 via-white to-amber-50 px-6">
      <div aria-hidden="true" className="absolute -left-20 top-1/4 h-56 w-56 rounded-full bg-emerald-200/30 blur-3xl" />
      <div aria-hidden="true" className="absolute -right-16 bottom-1/4 h-56 w-56 rounded-full bg-amber-200/30 blur-3xl" />

      <div className="relative text-center" role="status" aria-live="polite">
        <div className="relative mx-auto mb-7 flex h-32 w-32 items-center justify-center">
          <motion.div
            aria-hidden="true"
            className="absolute inset-2 rounded-[2rem] border border-emerald-200 bg-white/80 shadow-xl shadow-emerald-900/10"
            animate={reduceMotion ? undefined : { y: [0, -7, 0], rotate: [0, -2, 2, 0] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="relative z-10 flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-700 text-white shadow-lg shadow-emerald-900/20"
            animate={reduceMotion ? undefined : { scale: [1, 1.06, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          >
            <House className="h-11 w-11" strokeWidth={1.8} />
          </motion.div>
          <motion.span
            aria-hidden="true"
            className="absolute -right-1 top-1 z-20 flex h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-amber-400 text-emerald-950 shadow-md"
            animate={reduceMotion ? undefined : { rotate: [0, 16, -12, 0], y: [0, -3, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: 0.15 }}
          >
            <KeyRound className="h-5 w-5" />
          </motion.span>
          <motion.span
            aria-hidden="true"
            className="absolute -left-1 top-4 text-amber-500"
            animate={reduceMotion ? undefined : { scale: [0.75, 1.2, 0.75], rotate: [0, 18, 0], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.7, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Sparkles className="h-6 w-6" />
          </motion.span>
          <motion.span
            aria-hidden="true"
            className="absolute bottom-0 right-1 text-emerald-500"
            animate={reduceMotion ? undefined : { scale: [1, 0.7, 1], rotate: [0, -20, 0], opacity: [1, 0.45, 1] }}
            transition={{ duration: 1.9, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
          >
            <Sparkles className="h-4 w-4" />
          </motion.span>
        </div>

        <p className="text-xs font-extrabold uppercase tracking-[0.28em] text-emerald-700">MarketMix</p>
        <h1 className="mt-2 text-xl font-bold text-slate-900">Opening doors to your next home</h1>
        <div className="mt-5 flex items-center justify-center gap-1.5" aria-hidden="true">
          {[0, 1, 2].map((dot) => (
            <motion.span
              key={dot}
              className="h-2 w-2 rounded-full bg-emerald-600"
              animate={reduceMotion ? undefined : { y: [0, -5, 0], opacity: [0.45, 1, 0.45] }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut', delay: dot * 0.16 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
