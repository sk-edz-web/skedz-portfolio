import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Flame, Orbit, ArrowRight, Zap } from "lucide-react";
import SkedzLogo from "./SkedzLogo";

interface IntroScreenProps {
  onStart: () => void;
}

export default function IntroScreen({ onStart }: IntroScreenProps) {
  const [isCooking, setIsCooking] = useState(false);
  const fullText = "hey welcome to SK S-portal click cook button to start";
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index <= fullText.length) {
        setDisplayedText(fullText.slice(0, index));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 38);

    return () => clearInterval(interval);
  }, []);

  const handleCook = () => {
    setIsCooking(true);
    setTimeout(() => {
      onStart();
    }, 650);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05, filter: "blur(8px)" }}
      transition={{ duration: 0.6 }}
      className="relative min-h-screen w-full flex flex-col items-center justify-center px-4 py-12 z-20 text-center overflow-hidden"
    >
      {/* Background glow halo */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-gradient-to-br from-purple-900/30 via-indigo-950/20 to-transparent blur-3xl pointer-events-none -z-10 animate-pulse" />

      <div className="max-w-2xl mx-auto flex flex-col items-center">
        {/* Gateway Pill */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-950/40 border border-purple-500/30 text-purple-300 text-xs font-mono tracking-widest uppercase backdrop-blur-md mb-6 shadow-[0_0_15px_rgba(168,85,247,0.2)]"
        >
          <Orbit className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: "10s" }} />
          <span>SKEDZ-S.PORTAL • SYSTEM ONLINE</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
        </motion.div>

        {/* Prominent Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mb-6"
        >
          <SkedzLogo size="xl" className="shadow-[0_0_35px_rgba(168,85,247,0.5)]" />
        </motion.div>

        {/* Animated Introductory Message */}
        <div className="min-h-[110px] sm:min-h-[90px] flex items-center justify-center mb-8">
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-purple-200 to-cyan-300 leading-snug">
            {displayedText}
            {displayedText.length < fullText.length && (
              <span className="inline-block w-2.5 h-7 ml-1 bg-cyan-400 animate-pulse align-middle" />
            )}
          </h1>
        </div>

        {/* Supporting tag */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="text-slate-400 text-sm sm:text-base max-w-lg mb-10 leading-relaxed font-light"
        >
          Explore the official cosmic portal of <strong className="text-purple-300 font-medium">SKEDZ</strong>. 
          Discover series, full-stack portfolios, dynamic sub-routes, and digital creations.
        </motion.p>

        {/* The Cook Button */}
        <motion.button
          id="cook-start-button"
          onClick={handleCook}
          disabled={isCooking}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`group relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold text-base transition-all duration-300 shadow-2xl overflow-hidden cursor-pointer ${
            isCooking
              ? "bg-purple-700 text-white shadow-[0_0_40px_rgba(168,85,247,0.8)]"
              : "bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 text-white hover:shadow-[0_0_35px_rgba(147,51,234,0.6)] border border-white/20"
          }`}
        >
          {/* Shimmer sweep */}
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

          <Flame className={`w-5 h-5 text-amber-300 ${isCooking ? "animate-bounce" : "group-hover:scale-125 transition-transform"}`} />
          <span className="tracking-wide">
            {isCooking ? "Cooking Portal..." : "Cook"}
          </span>
          <ArrowRight className="w-4 h-4 text-purple-200 group-hover:translate-x-1 transition-transform" />

          {/* Outer cosmic border glow */}
          <span className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-purple-500 to-cyan-400 opacity-0 group-hover:opacity-40 -z-10 blur-sm transition-opacity" />
        </motion.button>

        {/* Quick Hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-6 flex items-center gap-2 text-xs text-slate-500 font-mono"
        >
          <Zap className="w-3.5 h-3.5 text-purple-400" />
          <span>Interactive 3D Galaxy Engine Active</span>
        </motion.div>
      </div>
    </motion.div>
  );
}
