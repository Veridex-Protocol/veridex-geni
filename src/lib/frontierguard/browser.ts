export async function copyText(value: string): Promise<void> {
  if (typeof navigator === "undefined" || !navigator.clipboard) {
    return;
  }

  await navigator.clipboard.writeText(value);
}

export function downloadText(filename: string, value: string, mimeType = "application/json"): void {
  if (typeof document === "undefined") {
    return;
  }

  const blob = new Blob([value], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
