import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** `false` saat SSR/hydration, `true` setelah mount di client. */
export function useHasMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
