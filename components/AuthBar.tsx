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
    // МЕНЯЕМ ТУТ: отправляем на лендинг, а не на страницу логина
    router.push('/') 
    router.refresh()
  }

  return (
    <div className="mb-6 flex items-center justify-between rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-1">
        <span className="text-sm text-muted-foreground">Вы вошли как</span>
        <span className="text-sm font-medium">{email}</span>
      </div>

      <div className="flex items-center gap-3">
        {/* Можно поменять Badge на что-то более подходящее для AI ассистента */}
        <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100">
          AI Beta
        </Badge>
        <Button variant="outline" onClick={signOut}>
          Выйти
        </Button>
      </div>
    </div>
  )
}