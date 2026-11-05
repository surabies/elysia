'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function HomePage() {
  const [healthStatus, setHealthStatus] = useState<string>('Checking...');
  const [apiInfo, setApiInfo] = useState<any>(null);
  const [echoMessage, setEchoMessage] = useState('Hello from Next.js Client!');
  const [echoResponse, setEchoResponse] = useState<any>(null);
  const [loadingEcho, setLoadingEcho] = useState(false);

  useEffect(() => {
    // Check API health
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setHealthStatus(data.status || 'unknown'))
      .catch(() => setHealthStatus('unreachable'));

    // Fetch API Root Info
    fetch('/api')
      .then((res) => res.json())
      .then((data) => setApiInfo(data))
      .catch(() => setApiInfo(null));
  }, []);

  const handleEcho = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingEcho(true);
    try {
      const res = await fetch('/api/echo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: echoMessage }),
      });
      const data = await res.json();
      setEchoResponse(data);
    } catch (err: any) {
      setEchoResponse({ error: err.message });
    } finally {
      setLoadingEcho(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="space-y-3 text-center py-6">
        <div className="flex items-center justify-center gap-2">
          <Badge variant="outline" className="text-sm px-3 py-1">
            Status: <span className="font-semibold text-emerald-600 ml-1">{healthStatus}</span>
          </Badge>
          {apiInfo && (
            <Badge variant="secondary" className="text-sm px-3 py-1">
              {apiInfo.name} v{apiInfo.version}
            </Badge>
          )}
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Fullstack ElysiaJS + Next.js App Router
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Equipped with Drizzle ORM, PostGIS spatial queries, Better Auth, and
          shadcn/ui. Deployed seamlessly to Vercel Serverless.
        </p>
        <div className="flex justify-center gap-4 pt-2">
          <Link href="/places">
            <Button size="lg">Explore PostGIS Places Demo</Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" size="lg">
              Open Dashboard
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Echo API Interactive Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Interactive Echo API</CardTitle>
            <CardDescription>
              Test Elysia endpoint <code className="bg-muted px-1 py-0.5 rounded text-xs">POST /api/echo</code> with TypeBox schema validation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleEcho} className="space-y-3">
              <Input
                placeholder="Enter message to echo..."
                value={echoMessage}
                onChange={(e) => setEchoMessage(e.target.value)}
                required
              />
              <Button type="submit" disabled={loadingEcho} className="w-full">
                {loadingEcho ? 'Sending...' : 'Send Request'}
              </Button>
            </form>

            {echoResponse && (
              <div className="mt-4 p-3 bg-muted rounded-md text-xs font-mono overflow-auto max-h-48">
                <pre>{JSON.stringify(echoResponse, null, 2)}</pre>
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Capabilities Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Stack & Features</CardTitle>
            <CardDescription>Architecture overview of this unified application</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-primary font-bold">✓</span>
              <div>
                <strong>Next.js 16 App Router:</strong> Server/Client components with Tailwind CSS v4.
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary font-bold">✓</span>
              <div>
                <strong>ElysiaJS Catch-all:</strong> Mounted at <code className="text-xs bg-muted px-1 rounded">/api/[[...slugs]]</code> with Eden Treaty type safety.
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary font-bold">✓</span>
              <div>
                <strong>Better Auth:</strong> Handled cleanly at <code className="text-xs bg-muted px-1 rounded">/api/auth/*</code> with Drizzle adapter.
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary font-bold">✓</span>
              <div>
                <strong>PostGIS Spatial Queries:</strong> Proximity radius search via <code className="text-xs bg-muted px-1 rounded">ST_DWithin</code> and GiST index.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
