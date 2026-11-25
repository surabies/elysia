## Error Type
Console Error

## Error Message
Only plain objects can be passed to Client Components from Server Components. Classes or other objects with methods are not supported.
  {id: "kinerja", title: ..., icon: {$$typeof: ..., render: ...}, items: ...}
                                    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^


    at push.console.error (src/components/PenyediaTema.tsx:17:26)
    at DocsSlugPage (src\app\(dashboard)\docs\[slug]\page.tsx:52:5)

## Code Frame
  15 |       return
  16 |     }
> 17 |     originalConsoleError.apply(console, args)
     |                          ^
  18 |   }
  19 | }
  20 |

Next.js version: 16.4.5 (Turbopack)
