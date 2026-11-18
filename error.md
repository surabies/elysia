## Error Type

Recoverable Error

## Error Message

Hydration failed because the server rendered HTML didn't match the client. As a result this tree will be regenerated on the client. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't match the server.
- External changing data without sending a snapshot of it along with the HTML.
- Invalid HTML tag nesting.

It can also happen if the client has a browser extension installed which messes with the HTML before React loaded.

https://react.dev/link/hydration-mismatch

...
<SegmentViewNode type="layout" pagePath="(dashboard...">
<SegmentTrieNode>

<script>
<script>
<DashboardLayout>
<SidebarProvider defaultOpen={true} defaultWidth={256}>
<TooltipProvider delayDuration={100}>
<TooltipProvider data-slot="tooltip-pr..." delayDuration={100}>
<TooltipProviderProvider scope={undefined} isOpenDelayedRef={{current:true}} delayDuration={100} ...>
<DashboardShell user={{name:"Supe...", ...}} onKeluar={function keluar}>
<RbacProvider roles={[...]}>
<div className="fixed inse...">
<a>
<div>
<aside aria-label="Navigasi m..." style={{width:"256px", ...}} className="fixed inse...">
<header>
<div

-                         className="sidebar-scroll relative flex-1 min-h-0 overflow-y-auto px-2 pt-2.5 pb-8 overscrol..."

*                         className="sidebar-scroll flex-1 min-h-0 overflow-y-auto px-2 pt-2.5 pb-2 overscroll-contain"
                        >
                        <section

-                         className="relative z-20 flex flex-col shrink-0 mt-auto bg-sidebar/85 backdrop-blur-md borde..."

*                         className="flex flex-col gap-2 shrink-0 mt-auto"
                        >
                          <div

-                           aria-hidden="true"

*                           aria-hidden={null}

-                           className="pointer-events-none absolute -top-8 inset-x-0 h-8 bg-gradient-to-t from-sidebar..."

*                           className="p-2"
                          >
*                           <div className="flex items-center w-full gap-1.5">
                          ...
                        ...
                      ...

  at div (<anonymous>:null:null)
  at DashboardShell (src/components/layout/shell/DashboardShell.tsx:193:13)
  at DashboardLayout (src\app\(dashboard)\layout.tsx:41:9)

## Code Frame

191 | <section className="relative z-20 flex flex-col shrink-0 mt-auto bg-sidebar/85 backdrop-blur-md border-t border-border/40">
192 | {/_ Gradasi blur lembut di atas footer agar menu memudar secara halus saat di-scroll _/}

> 193 | <div

      |             ^

194 | aria-hidden="true"
195 | className="pointer-events-none absolute -top-8 inset-x-0 h-8 bg-gradient-to-t from-sidebar via-sidebar/75 to-transparent"
196 | />

Next.js version: 16.4.5 (Turbopack)
