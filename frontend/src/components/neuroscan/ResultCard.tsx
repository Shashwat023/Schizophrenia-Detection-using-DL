import { AlertTriangle, CheckCircle2, ShieldCheck, Activity, BrainCircuit } from "lucide-react";
import { cn } from "@/lib/utils";

export type Prediction = { value: 0 | 1; label: string; confidence: number };

export const ResultCard = ({ result }: { result: Prediction }) => {
  const isDetected = result.value === 1;
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border-2 p-6 backdrop-blur-xl animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-500",
        isDetected
          ? "border-destructive/60 bg-destructive/10 shadow-[0_0_40px_-10px_hsl(var(--destructive)/0.6)]"
          : "border-success/60 bg-success/10 shadow-[0_0_40px_-10px_hsl(var(--success)/0.6)]",
      )}
    >
      {/* Animated grid background */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none animate-grid-move"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--foreground)/0.08) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)/0.08) 1px, transparent 1px)",
          backgroundSize: "25px 25px",
        }}
      />

      <div className="relative flex items-start gap-4">
        <div
          className={cn(
            "h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 animate-pulse-glow",
            isDetected ? "bg-destructive/20 border border-destructive/50" : "bg-success/20 border border-success/50",
          )}
        >
          {isDetected ? (
            <AlertTriangle className="h-7 w-7 text-destructive" />
          ) : (
            <CheckCircle2 className="h-7 w-7 text-success" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-mono">
            AI Analysis Result
          </p>
          <p
            className={cn(
              "text-2xl md:text-3xl font-bold mt-1",
              isDetected ? "text-destructive" : "text-success",
            )}
          >
            {result.label}
          </p>
          <p className="text-sm font-mono mt-2 text-muted-foreground">
            Confidence: <span className={cn("font-bold", isDetected ? "text-destructive" : "text-success")}>
              {Math.round(result.confidence * 100)}%
            </span>
          </p>
          <div className="flex flex-wrap gap-3 mt-4 text-xs font-mono">
            <span className="px-2.5 py-1 rounded-md bg-background/50 border border-border flex items-center gap-1.5">
              <BrainCircuit className="h-3 w-3 text-primary" /> AI Powered
            </span>
            <span className="px-2.5 py-1 rounded-md bg-background/50 border border-border flex items-center gap-1.5">
              <ShieldCheck className="h-3 w-3 text-primary" /> Verified
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};