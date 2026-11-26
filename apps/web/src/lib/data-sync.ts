// features/dashboard/shared/lib/data-sync.ts
// Utilitas sinkronisasi data: cross-tab BroadcastChannel dan in-app event
// Hanya menyegarkan saat ada event data masuk nyata (upload/mutasi), bukan polling buta.

export function broadcastDataUpdated() {
  if (typeof window === "undefined") return;
  try {
    const channel = new BroadcastChannel("cater_sync");
    channel.postMessage({ type: "cater:data-updated" });
    channel.close();
  } catch {
    // Fallback jika BroadcastChannel tidak didukung
  }
  window.dispatchEvent(new CustomEvent("cater:data-updated"));
}

export function subscribeDataUpdated(onUpdate: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const handleUpdate = () => onUpdate();
  window.addEventListener("cater:data-updated", handleUpdate);

  let channel: BroadcastChannel | null = null;
  if ("BroadcastChannel" in window) {
    try {
      channel = new BroadcastChannel("cater_sync");
      channel.onmessage = (event) => {
        if (event.data?.type === "cater:data-updated") {
          onUpdate();
        }
      };
    } catch {}
  }

  return () => {
    window.removeEventListener("cater:data-updated", handleUpdate);
    if (channel) channel.close();
  };
}
