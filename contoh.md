## Error Type

Console Error

## Error Message

In HTML, <div> cannot be a descendant of <p>.
This will cause a hydration error.

...
<DialogContentImpl role="alertdialog" **scopeDialog={{Dialog:[...]}} data-slot="alert-dial..." data-size="default" ...>
<FocusScopeBranchProvider registry={{...}}>
<FocusScope asChild={true} loop={true} trapped={true} branches={[...]} onMountAutoFocus={function handleEvent} ...>
<Primitive.div tabIndex={-1} asChild={true} ref={function} ...>
<Primitive.div.Slot tabIndex={-1} onKeyDown={function FocusScope.FocusScope2.useCallback[handleKeyDown]} ...>
<DismissableLayer role="alertdialog" id="radix-\_R_5..." aria-labelledby={undefined} ...>
<Primitive.div role="alertdialog" id="radix-\_R_5..." aria-labelledby={undefined} ...>
<div role="alertdialog" id="radix-\_R_5..." aria-labelledby={undefined} aria-describedby={undefined} ...>
<AlertDialogHeader>
<div data-slot="alert-dial..." className="grid grid-...">
<AlertDialogTitle>
<AlertDialogDescription className="space-y-3 ...">
<AlertDialogDescription data-slot="alert-dial..." className="text-copy-...">
<DialogDescription **scopeDialog={{Dialog:[...]}} data-slot="alert-dial..." ...>
<Primitive.p id="radix-\_R_5..." data-slot="alert-dial..." className="text-copy-..." ...>

>                               <p
>                                 id="radix-_R_5klritqabmqlbH2_"
>                                 data-slot="alert-dialog-description"
>                                 className="text-copy-13 text-muted-foreground space-y-3 text-left"
>                                 ref={null}
>                               >

                                  <span>
                                  <div className="rounded-lg...">

>                                   <div className="flex items-center gap-2">

                                    ...
                                  ...
                    ...



    at push.console.error (src/components/PenyediaTema.tsx:16:26)
    at div (<anonymous>:null:null)
    at BroadcastDashboardPage (src/app/(dashboard)/broadcast/page.tsx:556:19)

## Code Frame

14 | return
15 | }

> 16 | originalConsoleError.apply(console, args)

     |                          ^

17 | }
18 | }
19 |

Next.js version: 16.4.5 (Turbopack)

## Error Type

Console Error

## Error Message

<p> cannot contain a nested <div>.
See this log for the ancestor stack trace.

    at push.console.error (src/components/PenyediaTema.tsx:16:26)
    at p (<anonymous>:null:null)
    at AlertDialogDescription (src/components/ui/alert-dialog.tsx:123:5)
    at BroadcastDashboardPage (src/app/(dashboard)/broadcast/page.tsx:549:13)

## Code Frame

14 | return
15 | }

> 16 | originalConsoleError.apply(console, args)

     |                          ^

17 | }
18 | }
19 |

Next.js version: 16.4.5 (Turbopack)

## Error Type

Console Error

## Error Message

In HTML, <p> cannot be a descendant of <p>.
This will cause a hydration error.

...
<DialogContentImpl role="alertdialog" **scopeDialog={{Dialog:[...]}} data-slot="alert-dial..." data-size="default" ...>
<FocusScopeBranchProvider registry={{...}}>
<FocusScope asChild={true} loop={true} trapped={true} branches={[...]} onMountAutoFocus={function handleEvent} ...>
<Primitive.div tabIndex={-1} asChild={true} ref={function} ...>
<Primitive.div.Slot tabIndex={-1} onKeyDown={function FocusScope.FocusScope2.useCallback[handleKeyDown]} ...>
<DismissableLayer role="alertdialog" id="radix-\_R_5..." aria-labelledby={undefined} ...>
<Primitive.div role="alertdialog" id="radix-\_R_5..." aria-labelledby={undefined} ...>
<div role="alertdialog" id="radix-\_R_5..." aria-labelledby={undefined} aria-describedby={undefined} ...>
<AlertDialogHeader>
<div data-slot="alert-dial..." className="grid grid-...">
<AlertDialogTitle>
<AlertDialogDescription className="space-y-3 ...">
<AlertDialogDescription data-slot="alert-dial..." className="text-copy-...">
<DialogDescription **scopeDialog={{Dialog:[...]}} data-slot="alert-dial..." ...>
<Primitive.p id="radix-\_R_5..." data-slot="alert-dial..." className="text-copy-..." ...>

>                               <p
>                                 id="radix-_R_5klritqabmqlbH2_"
>                                 data-slot="alert-dialog-description"
>                                 className="text-copy-13 text-muted-foreground space-y-3 text-left"
>                                 ref={null}
>                               >

                                  <span>
                                  <div className="rounded-lg...">
                                    <div>

>                                   <p className="font-semibold text-copy-14 text-foreground leading-snug">

                                    ...
                                  ...
                    ...



    at push.console.error (src/components/PenyediaTema.tsx:16:26)
    at p (<anonymous>:null:null)
    at BroadcastDashboardPage (src/app/(dashboard)/broadcast/page.tsx:564:19)

## Code Frame

14 | return
15 | }

> 16 | originalConsoleError.apply(console, args)

     |                          ^

17 | }
18 | }
19 |

Next.js version: 16.4.5 (Turbopack)

## Error Type

Console Error

## Error Message

<p> cannot contain a nested <p>.
See this log for the ancestor stack trace.

    at push.console.error (src/components/PenyediaTema.tsx:16:26)
    at p (<anonymous>:null:null)
    at AlertDialogDescription (src/components/ui/alert-dialog.tsx:123:5)
    at BroadcastDashboardPage (src/app/(dashboard)/broadcast/page.tsx:549:13)

## Code Frame

14 | return
15 | }

> 16 | originalConsoleError.apply(console, args)

     |                          ^

17 | }
18 | }
19 |

Next.js version: 16.4.5 (Turbopack)
