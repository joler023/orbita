"use client";

import { cn } from "@/lib/cn";
import { UploadCloud } from "lucide-react";
import { useId, useRef, useState, type DragEvent } from "react";

export type FileDropProps = {
  label: string;
  hint: string;
  accept: ReadonlyArray<string>;
  maxBytes: number;
  onFiles: (files: File[]) => void;
  onReject: (message: string) => void;
  disabled?: boolean;
};

export function validateFile(
  file: File,
  accept: ReadonlyArray<string>,
  maxBytes: number,
): string | null {
  const name = file.name.toLowerCase();
  const extension = name.includes(".") ? name.slice(name.lastIndexOf(".")) : "";
  if (!accept.includes(extension)) {
    return `«${file.name}» no se puede subir. Usa un archivo ${formatAccept(accept)}.`;
  }
  if (file.size > maxBytes) {
    return `«${file.name}» pesa más de ${formatMegabytes(maxBytes)}. Divídelo o comprímelo antes de subirlo.`;
  }
  return null;
}

export function FileDrop({
  label,
  hint,
  accept,
  maxBytes,
  onFiles,
  onReject,
  disabled = false,
}: FileDropProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = (list: FileList | null) => {
    if (!list || disabled) {
      return;
    }
    const accepted: File[] = [];
    for (const file of Array.from(list)) {
      const problem = validateFile(file, accept, maxBytes);
      if (problem) {
        onReject(problem);
      } else {
        accepted.push(file);
      }
    }
    if (accepted.length > 0) {
      onFiles(accepted);
    }
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    handleFiles(event.dataTransfer.files);
  };

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) {
          setDragging(true);
        }
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={cn(
        "flex flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-6 text-center text-sm",
        dragging ? "border-orbita-600 bg-orbita-50" : "border-border bg-surface",
        disabled ? "opacity-60" : null,
      )}
    >
      <UploadCloud className="size-6 text-muted" aria-hidden="true" />
      <label htmlFor={inputId} className={cn("font-medium text-foreground", disabled ? null : "cursor-pointer underline-offset-2 hover:underline")}>
        {label}
      </label>
      <p className="text-xs text-muted">{hint}</p>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        multiple
        disabled={disabled}
        accept={accept.join(",")}
        className="sr-only"
        onChange={(event) => {
          handleFiles(event.target.files);
          if (inputRef.current) {
            inputRef.current.value = "";
          }
        }}
      />
    </div>
  );
}

function formatAccept(accept: ReadonlyArray<string>): string {
  const names = accept.map((extension) => extension.replace(".", "").toUpperCase());
  if (names.length <= 1) {
    return names.join("");
  }
  return `${names.slice(0, -1).join(", ")} o ${names[names.length - 1]}`;
}

function formatMegabytes(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}
