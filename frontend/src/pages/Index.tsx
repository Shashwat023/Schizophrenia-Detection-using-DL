import { useEffect, useState } from "react";
import { AlertCircle, Loader2, ScanLine, Upload as UploadIcon, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroSection } from "@/components/neuroscan/HeroSection";
import { Brain3D } from "@/components/neuroscan/Brain3D";
import { UploadBox } from "@/components/neuroscan/UploadBox";
import { ResultCard, type Prediction } from "@/components/neuroscan/ResultCard";
import { ProcessingFlow } from "@/components/neuroscan/ProcessingFlow";

const API_UPLOAD_URL = "http://127.0.0.1:5000/upload";

interface AiSummaryData {
  summary?: string;
  key_takeaways?: string[];
  next_steps?: string[];
}

interface ApiResponse {
  prediction: number;
  label: string;
  confidence: number;
  filename: string;
  ai_summary?: AiSummaryData | string;
}

const Index = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Prediction | null>(null);
  const [aiSummary, setAiSummary] = useState<AiSummaryData | string | null>(null);

  // generate preview from file
  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreview(null);
  }, [file]);

  // scan progress animation while loading
  useEffect(() => {
    if (!loading) {
      setProgress(0);
      return;
    }
    const id = setInterval(() => {
      setProgress((p) => (p < 92 ? p + Math.random() * 7 : p));
    }, 180);
    return () => clearInterval(id);
  }, [loading]);

  const handleFile = (f: File | null) => {
    setFile(f);
    setError(null);
    setResult(null);
    setAiSummary(null);
  };

  const handleScan = async () => {
    if (!file) {
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setAiSummary(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(API_UPLOAD_URL, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Server responded with ${res.status}: ${errText}`);
      }

      const json: ApiResponse = await res.json();

      let summaryData = json.ai_summary;
      if (typeof summaryData === 'string') {
        try {
          // Sometimes the string is wrapped in markdown json block like ```json ... ```
          const cleanedString = summaryData.replace(/```json\n?|\n?```/g, '').trim();
          summaryData = JSON.parse(cleanedString);
        } catch (e) {
          // ignore, keep as string
        }
      }

      setProgress(100);
      setResult({ value: json.prediction as 0 | 1, label: json.label, confidence: json.confidence });
      setAiSummary(summaryData ?? null);
    } catch (e: any) {
      setError(e?.message ?? "Failed to reach the prediction API.");
    } finally {
      setTimeout(() => setLoading(false), 250);
    }
  };

  return (
    <main className="relative min-h-screen w-full overflow-hidden">
      {/* Decorative grid + glow */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
        }}
      />
      <div aria-hidden className="pointer-events-none fixed -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-primary/20 blur-[120px]" />
      <div aria-hidden className="pointer-events-none fixed -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-[hsl(var(--neon-pink)/0.18)] blur-[120px]" />

      <div className="relative max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-10">
        <HeroSection />

        <div className="grid lg:grid-cols-5 gap-6 mt-6">
          {/* Left: 3D Brain */}
          <div className="lg:col-span-3 rounded-3xl border border-border/60 bg-card/40 backdrop-blur-xl shadow-card overflow-hidden relative">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border/50 bg-background/30">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                Live Visualization
              </div>
              <span className="text-[10px] font-mono text-primary">3D · NEURAL · 64³</span>
            </div>
            <Brain3D scanning={loading} />
          </div>

          {/* Right: Controls */}
          <div className="lg:col-span-2 rounded-3xl border border-border/60 bg-card/50 backdrop-blur-xl shadow-card p-5 md:p-6 space-y-5">
            <UploadBox file={file} preview={preview} onFile={handleFile} disabled={loading} />

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                size="lg"
                disabled={loading}
                className="rounded-xl border-border/70 bg-secondary/40 hover:bg-secondary/70"
                asChild
              >
                <label className="cursor-pointer">
                  <UploadIcon className="h-4 w-4" />
                  Upload MRI
                  <input
                    type="file"
                    accept=".nii"
                    className="hidden"
                    onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              </Button>
              <Button
                size="lg"
                onClick={handleScan}
                disabled={loading || !file}
                className="rounded-xl bg-gradient-neon hover:opacity-90 text-background font-semibold shadow-neon border-0 animate-pulse-glow disabled:animate-none disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Scanning…
                  </>
                ) : (
                  <>
                    <ScanLine className="h-4 w-4" /> Run AI Scan
                  </>
                )}
              </Button>
            </div>

            {(loading || result) && (
              <div className="space-y-3">
                {/* Progress bar — visible only while loading */}
                {loading && (
                  <div className="space-y-1.5 animate-in fade-in">
                    <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                      <span>Analyzing volume…</span>
                      <span className="text-primary">{Math.min(99, Math.floor(progress))}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden relative">
                      <div
                        className="h-full bg-gradient-neon transition-all duration-200"
                        style={{ width: `${progress}%` }}
                      />
                      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,hsl(var(--primary)/0.6),transparent)] animate-[scan-line_1.5s_linear_infinite]" />
                    </div>
                  </div>
                )}

                {/* Pipeline flow — shown while loading AND after done */}
                <ProcessingFlow active={loading} done={!!result && !loading} />
              </div>
            )}

            {error && (
              <div className="flex items-start gap-3 p-4 rounded-xl border border-destructive/40 bg-destructive/10 animate-in fade-in slide-in-from-bottom-2">
                <AlertCircle className="h-5 w-5 mt-0.5 text-destructive shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-destructive">Connection failed</p>
                  <p className="text-muted-foreground mt-0.5 text-xs">{error}</p>
                </div>
              </div>
            )}

            {result && !loading && <ResultCard result={result} />}

            {aiSummary && !loading && (
              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                    AI Medical Summary
                  </h3>
                </div>
                <div className="p-4 rounded-xl border border-border/60 bg-background/40 text-sm leading-relaxed">
                  {typeof aiSummary === 'string' ? (
                    <p className="text-muted-foreground whitespace-pre-wrap">{aiSummary}</p>
                  ) : (
                    <div className="space-y-4">
                      {aiSummary.summary && (
                        <div>
                          <h4 className="text-primary font-medium mb-1">Clinical Summary</h4>
                          <p className="text-muted-foreground">{aiSummary.summary}</p>
                        </div>
                      )}
                      {aiSummary.key_takeaways && aiSummary.key_takeaways.length > 0 && (
                        <div>
                          <h4 className="text-primary font-medium mb-1">Key Takeaways</h4>
                          <ul className="list-disc list-inside text-muted-foreground space-y-1">
                            {aiSummary.key_takeaways.map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {aiSummary.next_steps && aiSummary.next_steps.length > 0 && (
                        <div>
                          <h4 className="text-primary font-medium mb-1">Next Steps</h4>
                          <ul className="list-disc list-inside text-muted-foreground space-y-1">
                            {aiSummary.next_steps.map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            <p className="text-[10px] text-center text-muted-foreground font-mono pt-2 border-t border-border/40">
              ENDPOINT · <span className="text-primary">{API_UPLOAD_URL}</span>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Index;
