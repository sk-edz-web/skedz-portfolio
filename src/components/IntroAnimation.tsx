import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, ChevronRight, Play } from 'lucide-react';

interface IntroAnimationProps {
  onComplete: () => void;
}

const introSteps = [
  {
    id: 1,
    title: "Hello, welcome to my portfolio",
    subtitle: "A showcase of creative engineering and visual artistry.",
    accent: "from-sky-600 via-blue-600 to-indigo-600",
  },
  {
    id: 2,
    title: "I am a web developer and editor",
    subtitle: "Building seamless code & directing captivating visuals.",
    accent: "from-indigo-600 via-purple-600 to-pink-600",
  },
  {
    id: 3,
    title: "Hope you enjoy exploring my work.",
    subtitle: "Dive into my projects, creative edits, and technical journey.",
    accent: "from-purple-600 via-pink-600 to-amber-600",
  },
];

export default function IntroAnimation({ onComplete }: IntroAnimationProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isReadyStage, setIsReadyStage] = useState(false);

  // Auto-advance through the 3 texts
  useEffect(() => {
    if (isReadyStage) return;

    const timer = setTimeout(() => {
      if (currentStep < introSteps.length - 1) {
        setCurrentStep((prev) => prev + 1);
      } else {
        // All 3 texts finished -> Show "Let's Cook" Start screen
        setIsReadyStage(true);
      }
    }, 2700);

    return () => clearTimeout(timer);
  }, [currentStep, isReadyStage]);

  const handleNextOrFinish = () => {
    if (currentStep < introSteps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      setIsReadyStage(true);
    }
  };

  const stepData = introSteps[currentStep];

  return (
    <motion.div
      id="intro-animation-screen"
      className="fixed inset-0 z-50 flex flex-col justify-between bg-white text-slate-900 px-4 sm:px-6 overflow-y-auto select-none min-h-[100dvh] py-6 sm:py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.02, filter: "blur(6px)" }}
      transition={{ duration: 0.55, ease: "easeInOut" }}
    >
      {/* Light soft ambient background glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-28 -left-28 w-[450px] h-[450px] rounded-full bg-sky-100/80 blur-3xl" />
        <div className="absolute -bottom-28 -right-28 w-[450px] h-[450px] rounded-full bg-purple-100/70 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.4)_0%,rgba(248,250,252,0.98)_100%)]" />
      </div>

      {/* Top Header Bar with Step Dots and Skip */}
      <div className="relative z-20 w-full max-w-2xl mx-auto flex items-center justify-between">
        {!isReadyStage ? (
          <div className="flex items-center gap-2">
            {introSteps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentStep
                    ? "w-7 bg-sky-600 shadow-xs"
                    : idx < currentStep
                    ? "w-2.5 bg-slate-400"
                    : "w-2.5 bg-slate-200"
                }`}
              />
            ))}
          </div>
        ) : (
          <div />
        )}

        <button
          onClick={onComplete}
          className="text-xs font-medium text-slate-500 hover:text-slate-900 px-3 py-1 rounded-full bg-slate-100/80 hover:bg-slate-200/80 border border-slate-200 transition-colors"
        >
          Skip to portfolio
        </button>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 max-w-2xl w-full mx-auto text-center my-auto py-4 flex flex-col items-center">
        <AnimatePresence mode="wait">
          {!isReadyStage ? (
            /* ============= PHASE 1: The 3 Animated Text Slides ============= */
            <motion.div
              key={`intro-step-${currentStep}`}
              initial={{ opacity: 0, scale: 0.96, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.04, y: -14 }}
              transition={{
                duration: 0.55,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="flex flex-col items-center w-full"
            >
              {/* Counter with NO STAR - only clean number */}
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 mb-4 shadow-xs">
                <span>0{currentStep + 1} / 03</span>
              </div>

              <h1
                className={`text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-3 sm:mb-4 bg-gradient-to-r ${stepData.accent} bg-clip-text text-transparent font-heading leading-tight px-2`}
              >
                {stepData.title}
              </h1>

              <p className="text-xs sm:text-sm md:text-base text-slate-600 font-normal max-w-md leading-relaxed mb-6 sm:mb-8 px-4">
                {stepData.subtitle}
              </p>

              <button
                type="button"
                onClick={handleNextOrFinish}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors shadow-xs"
              >
                <span>{currentStep < 2 ? "Next message" : "Proceed"}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ) : (
            /* ============= PHASE 2: The Final "Let's Cook" Start Screen ============= */
            <motion.div
              key="intro-lets-cook-stage"
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.05, y: -10 }}
              transition={{
                duration: 0.6,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="flex flex-col items-center w-full"
            >
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs font-bold text-amber-700 mb-4 shadow-xs animate-pulse">
                <Flame className="w-3.5 h-3.5 text-amber-600" />
                <span>Ready to Explore</span>
              </div>

              <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-3 sm:mb-4 text-slate-900 font-heading leading-tight px-2">
                Hey there! Are you ready to see my portfolio?{" "}
                <span className="block mt-2 bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 bg-clip-text text-transparent">
                  Let's cook! 🔥
                </span>
              </h1>

              <p className="text-xs sm:text-sm md:text-base text-slate-600 font-normal max-w-lg leading-relaxed mb-6 sm:mb-8 px-4">
                Explore interactive Web Development projects, cinematic Video Edits, and work experience.
              </p>

              {/* Start Button - Clicking this enters the Home Page */}
              <motion.button
                id="btn-intro-start-lets-cook"
                onClick={onComplete}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2.5 px-8 py-3.5 sm:px-9 sm:py-4 rounded-2xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-sm sm:text-base shadow-xl shadow-sky-600/25 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Start • Let's Cook</span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom spacer / footer note for balanced vertical spacing */}
      <div className="relative z-20 text-center py-2 text-[11px] text-slate-400">
        <span>Sarathi • Web Developer & Freelance Editor</span>
      </div>
    </motion.div>
  );
}
