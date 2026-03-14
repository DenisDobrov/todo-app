'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function AuthBar({ email }: { email: string }) {
  const supabase = createClient()
  const router = useRouter()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/auth')
    router.refresh()
  }

  return (
    <div className="mb-6 flex items-center justify-between rounded-xl border bg-card p-4">
      <div className="flex flex-col gap-1">
        <span className="text-sm text-muted-foreground">Signed in as</span>
        <span className="text-sm font-medium">{email}</span>
      </div>

      <div className="flex items-center gap-3">
        <Badge variant="secondary">Active</Badge>
        <Button variant="outline" onClick={signOut}>
          Sign out
        </Button>
      </div>
    </div>
  )
}