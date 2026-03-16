import { Navigation } from "@/components/landing/navigation"
import { Hero } from "@/components/landing/hero"
import { SocialProof } from "@/components/landing/social-proof"
import { WhoItsFor } from "@/components/landing/who-its-for"
import { Features } from "@/components/landing/features"
import { HowItWorks } from "@/components/landing/how-it-works"
import { Testimonials } from "@/components/landing/testimonials"
import { Pricing } from "@/components/landing/pricing"
import { FAQ } from "@/components/landing/faq"
import { FinalCTA } from "@/components/landing/final-cta"
import { Footer } from "@/components/landing/footer"

// GEMINI VOICE
import { createClient } from '@/lib/supabase/server'
import { TodoDashboard } from "@/components/dashboard/todo-dashboard"

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Если пользователь залогинен, показываем приложение
  if (user) {
    // Безопасно извлекаем имя и email для пропсов
    const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
    const email = user.email || ''

    return (
      <TodoDashboard 
        user={user} 
        userName={userName} 
        email={email} 
      />
    )
  }

  // Если нет — показываем лендинг
  return (
    <main className="min-h-screen">
      <Navigation />
      <Hero />
      <SocialProof />
      <WhoItsFor />
      <Features />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <Footer />
    </main>
  )
}