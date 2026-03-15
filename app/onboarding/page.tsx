import { redirect } from 'next/navigation'

// L'onboarding è gestito direttamente dal layout protetto.
// Questa route reindirizza alla dashboard che triggera il wizard se necessario.
export default function OnboardingRedirect() {
  redirect('/dashboard')
}
