import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/src/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DashboardClient } from './dashboard-client';

export default async function DashboardPage() {
  const reqHeaders = await headers();
  const sessionData = await auth.api.getSession({
    headers: reqHeaders,
  });

  if (!sessionData?.session || !sessionData?.user) {
    redirect('/sign-in');
  }

  const { user, session } = sessionData;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Protected server-rendered page verified with Better Auth
          </p>
        </div>
        <DashboardClient />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>User Profile</CardTitle>
            <CardDescription>Authenticated user details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <span className="text-muted-foreground block text-xs">Name</span>
              <span className="font-medium text-base">{user.name}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs">Email</span>
              <span className="font-medium">{user.email}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs">User ID</span>
              <code className="text-xs font-mono bg-muted px-2 py-1 rounded block mt-1 overflow-x-auto">
                {user.id}
              </code>
            </div>
            <div className="pt-2">
              <Badge variant="outline" className="text-emerald-600 border-emerald-300">
                Session Active
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Session Details</CardTitle>
            <CardDescription>Current cryptographic token & expiry</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <span className="text-muted-foreground block text-xs">Session Token</span>
              <code className="text-xs font-mono bg-muted px-2 py-1 rounded block mt-1 truncate">
                {session.token}
              </code>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs">Expires At</span>
              <span className="font-medium">
                {new Date(session.expiresAt).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs">User Agent</span>
              <span className="text-xs font-mono text-muted-foreground truncate block">
                {session.userAgent || 'Unknown'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
