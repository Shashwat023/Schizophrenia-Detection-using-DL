import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  FileInput,
  FilterX,
  BarChart2,
  Maximize2,
  BrainCircuit,
  Percent,
  CheckCheck,
} from "lucide-react";

export type FlowStep = {
  id: number;
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  color: string;         // Tailwind text-color class
  borderColor: string;   // Tailwind border-color class
  bgColor: string;       // Tailwind bg-color class
  glowColor: string;     // inline style glow
};

const STEPS: FlowStep[] = [
  {
    id: 1,
    icon: <FileInput className="h-5 w-5" />,
    label: "Load NIfTI",
    sublabel: ".nii → 3D array",
    color: "text-cyan-400",
    borderColor: "border-cyan-500/60",
    bgColor: "bg-cyan-500/10",
    glowColor: "rgba(34,211,238,0.35)",
  },
  {
    id: 2,
    icon: <FilterX className="h-5 w-5" />,
    label: "NaN Cleanup",
    sublabel: "nan_to_num()",
    color: "text-sky-400",
    borderColor: "border-sky-500/60",
    bgColor: "bg-sky-500/10",
    glowColor: "rgba(56,189,248,0.35)",
  },
  {
    id: 3,
    icon: <BarChart2 className="h-5 w-5" />,
    label: "Z-Normalize",
    sublabel: "(x − μ) / (σ + 1e-5)",
    color: "text-violet-400",
    borderColor: "border-violet-500/60",
    bgColor: "bg-violet-500/10",
    glowColor: "rgba(167,139,250,0.35)",
  },
  {
    id: 4,
    icon: <Maximize2 className="h-5 w-5" />,
    label: "Resize 64³",
    sublabel: "trilinear interpolation",
    color: "text-fuchsia-400",
    borderColor: "border-fuchsia-500/60",
    bgColor: "bg-fuchsia-500/10",
    glowColor: "rgba(232,121,249,0.35)",
  },
  {
    id: 5,
    icon: <BrainCircuit className="h-5 w-5" />,
    label: "CNN3D Inference",
    sublabel: "Conv3D × 3 → FC layers",
    color: "text-pink-400",
    borderColor: "border-pink-500/60",
    bgColor: "bg-pink-500/10",
    glowColor: "rgba(244,114,182,0.35)",
  },
  {
    id: 6,
    icon: <Percent className="h-5 w-5" />,
    label: "Softmax",
    sublabel: "P(Control) · P(Schizo)",
    color: "text-orange-400",
    borderColor: "border-orange-500/60",
    bgColor: "bg-orange-500/10",
    glowColor: "rgba(251,146,60,0.35)",
  },
  {
    id: 7,
    icon: <CheckCheck className="h-5 w-5" />,
    label: "Classification",
    sublabel: "argmax → label",
    color: "text-emerald-400",
    borderColor: "border-emerald-500/60",
    bgColor: "bg-emerald-500/10",
    glowColor: "rgba(52,211,153,0.35)",
  },
];

// How many ms each step takes (total 5s for all 7 steps)
const STEP_DURATIONS = [400, 500, 700, 700, 1000, 700, 500];

interface Props {
  active: boolean;   // true while loading
  done: boolean;     // true when prediction has arrived
}

export const ProcessingFlow = ({ active, done }: Props) => {
  const [currentStep, setCurrentStep] = useState(-1);

  useEffect(() => {
    if (!active) {
      if (!done) setCurrentStep(-1);
      return;
    }

    // Animate through steps sequentially while active
    setCurrentStep(0);
    let step = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const advance = (i: number) => {
      if (i >= STEPS.length) return;
      const t = setTimeout(() => {
        setCurrentStep(i + 1);
        advance(i + 1);
      }, STEP_DURATIONS[i]);
      timers.push(t);
    };

    advance(0);
    return () => timers.forEach(clearTimeout);
  }, [active, done]);

  // When done, keep all steps highlighted
  const displayStep = done ? STEPS.length : currentStep;

  const stepState = (idx: number): "done" | "active" | "pending" => {
    if (idx < displayStep) return "done";
    if (idx === displayStep) return "active";
    return "pending";
  };

  if (!active && !done) return null;

  return (
    <div className="w-full space-y-2 animate-in fade-in slide-in-from-bottom-3 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          Pipeline · model.pth
        </span>
        {done && (
          <span className="text-[10px] font-mono text-emerald-400 animate-in fade-in">
            ✓ Complete
          </span>
        )}
        {active && !done && (
          <span className="text-[10px] font-mono text-primary animate-pulse">
            Processing…
          </span>
        )}
      </div>

      {/* Step list */}
      <div className="relative flex flex-col gap-1.5">
        {/* Connector line */}
        <div className="absolute left-5 top-5 bottom-5 w-px bg-border/50 z-0" />

        {STEPS.map((step, idx) => {
          const state = stepState(idx);
          return (
            <div
              key={step.id}
              className={cn(
                "relative z-10 flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all duration-500",
                state === "done"
                  ? `${step.bgColor} ${step.borderColor}`
                  : state === "active"
                  ? `${step.bgColor} ${step.borderColor} ring-1 ring-inset ring-current/40`
                  : "bg-background/20 border-border/30 opacity-40",
              )}
              style={
                state !== "pending"
                  ? { boxShadow: `0 0 14px -4px ${step.glowColor}` }
                  : undefined
              }
            >
              {/* Icon bubble */}
              <div
                className={cn(
                  "h-6 w-6 rounded-lg flex items-center justify-center shrink-0 transition-all duration-500",
                  state === "done"
                    ? `${step.bgColor} ${step.color}`
                    : state === "active"
                    ? `${step.bgColor} ${step.color} animate-pulse`
                    : "text-muted-foreground/40",
                )}
              >
                {step.icon}
              </div>

              {/* Labels */}
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-xs font-semibold leading-none transition-colors duration-500",
                    state !== "pending" ? step.color : "text-muted-foreground/50",
                  )}
                >
                  {step.label}
                </p>
                <p className="text-[10px] text-muted-foreground/60 mt-0.5 font-mono truncate">
                  {step.sublabel}
                </p>
              </div>

              {/* Status indicator */}
              <div className="shrink-0">
                {state === "done" && (
                  <span className={cn("text-[10px] font-mono animate-in fade-in", step.color)}>
                    ✓
                  </span>
                )}
                {state === "active" && (
                  <span className="inline-block h-2 w-2 rounded-full bg-current animate-ping" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
