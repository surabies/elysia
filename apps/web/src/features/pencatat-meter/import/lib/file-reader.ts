// features/dashboard/import/lib/file-reader.ts

function readFile(file: File, mode: "text" | "dataUrl"): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    if (mode === "text") reader.readAsText(file);
    else reader.readAsDataURL(file);
  });
}

export const readFileAsText = (file: File) => readFile(file, "text");
export const readFileAsDataUrl = (file: File) => readFile(file, "dataUrl");

export const formatFileSize = (bytes: number) =>
  `${(bytes / 1024).toFixed(0)} KB`;
