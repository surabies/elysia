import { useCallback, useEffect, useRef, useState } from "react";

/** State menu yang terbuka saat hover dan menutup dengan jeda. */
export function useHoverMenu(closeDelay = 500) {
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const cancelClose = useCallback(() => clearTimeout(timer.current), []);

  const show = useCallback(() => {
    cancelClose();
    setOpen(true);
  }, [cancelClose]);

  const scheduleHide = useCallback(() => {
    cancelClose();
    timer.current = setTimeout(() => setOpen(false), closeDelay);
  }, [cancelClose, closeDelay]);

  useEffect(() => cancelClose, [cancelClose]);

  return { open, setOpen, show, scheduleHide };
}
