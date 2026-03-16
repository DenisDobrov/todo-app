'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

// МЕНЯЕМ ТУТ: теперь компонент ждет userName
interface AuthBarProps {
  userName: string
}

export default function AuthBar({ userName }: AuthBarProps) {
  const supabase = createClient()
  const router = useRouter()

  async function signOut() {
    await supabase.auth.signOut()
    // Уходим на лендинг
    router.push('/')
    router.refresh()
  }

  return (
    <div className="mb-6 flex items-center justify-between rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-1">
        <span className="text-sm text-muted-foreground">Вы вошли как</span>
        <span className="text-sm font-medium">{userName}</span>
      </div>

      <div className="flex items-center gap-3">
        <Badge variant="secondary" className="bg-green-100 text-green-700">
          AI Sync Active
        </Badge>
        <Button variant="outline" size="sm" onClick={signOut}>
          Выйти
        </Button>
      </div>
    </div>
  )
}