import { Activity, Brain } from "lucide-react";

export const HeroSection = () => {
  return (
    <section className="relative text-center py-10 md:py-14 animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/40 bg-primary/10 backdrop-blur-md text-xs font-mono uppercase tracking-widest text-primary mb-6">
        <Activity className="h-3.5 w-3.5 animate-pulse" />
        <span>Neural Imaging System • Online</span>
      </div>
      <div className="flex items-center justify-center gap-3 mb-4">
        <div className="relative">
          <div className="absolute inset-0 bg-primary blur-2xl opacity-50 rounded-full" />
          <div className="relative h-12 w-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-neon animate-pulse-glow">
            <Brain className="h-6 w-6 text-background" strokeWidth={2.4} />
          </div>
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tight bg-gradient-neon bg-clip-text text-transparent">
          NeuroScan AI
        </h1>
      </div>
      <p className="mt-3 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
        Advanced Brain MRI Analysis using <span className="text-primary font-semibold">Deep Learning</span>
      </p>
    </section>
  );
};