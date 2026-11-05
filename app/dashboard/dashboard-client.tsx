'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from '@/src/lib/auth-client';
import { Button } from '@/components/ui/button';

export function DashboardClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut();
      router.push('/sign-in');
      router.refresh();
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="destructive"
      size="sm"
      disabled={loading}
      onClick={handleSignOut}
    >
      {loading ? 'Signing out...' : 'Sign Out'}
    </Button>
  );
}
