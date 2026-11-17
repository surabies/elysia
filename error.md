## Error Type
Build Error

## Error Message
Module not found: Can't resolve 'react-parallax-tilt'

## Build Output
./apps/web/src/components/ui/holo-card.tsx:6:1
Error: Module not found: Can't resolve 'react-parallax-tilt'
  4 | import type React from "react";
  5 | import { useRef, useState, useCallback } from "react";
> 6 | import Tilt from "react-parallax-tilt";
    | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  7 | import { cn } from "@/lib/utils";
  8 | import "./holo-card.css";
  9 |

Import traces:
  Client Component Browser:
    ./apps/web/src/components/ui/holo-card.tsx [Client Component Browser]
    ./apps/web/src/components/home/EventCard.tsx [Client Component Browser]
    ./apps/web/src/components/home/TopEventsSection.tsx [Client Component Browser]
    ./apps/web/src/components/home/TopEventsSection.tsx [Server Component]
    ./apps/web/src/app/page.tsx [Server Component]

  Client Component SSR:
    ./apps/web/src/components/ui/holo-card.tsx [Client Component SSR]
    ./apps/web/src/components/home/EventCard.tsx [Client Component SSR]
    ./apps/web/src/components/home/TopEventsSection.tsx [Client Component SSR]
    ./apps/web/src/components/home/TopEventsSection.tsx [Server Component]
    ./apps/web/src/app/page.tsx [Server Component]

https://nextjs.org/docs/messages/module-not-found

Next.js version: 16.4.5 (Turbopack)
