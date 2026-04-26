import { useRef, useState } from "react";
import { Upload, X, FileImage } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  file: File | null;
  preview: string | null;
  onFile: (file: File | null) => void;
  disabled?: boolean;
};

export const UploadBox = ({ file, preview, onFile, disabled }: Props) => {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || !files[0]) return;
    onFile(files[0]);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          // Input · MRI Scan
        </h2>
        <span className="text-[10px] font-mono text-primary/80">.jpg .png .nii</span>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          if (disabled) return;
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => !disabled && inputRef.current?.click()}
        className={cn(
          "group relative cursor-pointer rounded-2xl border-2 border-dashed transition-all overflow-hidden",
          "bg-card/40 backdrop-blur-md min-h-[220px] flex items-center justify-center",
          drag
            ? "border-primary bg-primary/10 shadow-neon"
            : "border-border hover:border-primary/60 hover:bg-card/60",
          disabled && "opacity-60 pointer-events-none",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.nii"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {preview ? (
          <div className="relative w-full">
            <img
              src={preview}
              alt="MRI preview"
              className="w-full h-56 object-contain bg-background/40"
            />
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_50%,hsl(var(--primary)/0.06)_50%)] bg-[length:100%_4px]" />
            <div className="absolute top-3 left-3 px-2 py-1 rounded bg-background/70 backdrop-blur text-[10px] font-mono text-primary border border-primary/40">
              SCAN LOADED
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onFile(null);
              }}
              className="absolute top-3 right-3 h-7 w-7 rounded-full bg-background/80 hover:bg-destructive/80 border border-border flex items-center justify-center transition-colors"
              aria-label="Remove file"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : file ? (
          <div className="flex flex-col items-center gap-2 text-center px-6">
            <FileImage className="h-10 w-10 text-primary" />
            <p className="text-sm text-foreground font-medium">{file.name}</p>
            <p className="text-xs text-muted-foreground font-mono">
              {(file.size / 1024).toFixed(1)} KB
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-center px-6 py-8">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center group-hover:bg-primary/20 group-hover:scale-110 transition-all">
              <Upload className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Drag & drop MRI scan here
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                or <span className="text-primary underline">click to browse</span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};