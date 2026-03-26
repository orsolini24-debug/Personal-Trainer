/**
 * DEPRECATED — old chat-based onboarding route.
 * All onboarding now flows through /plan (PlanSetupFlow).
 */
import { redirect } from 'next/navigation'

export default function OnboardingPage() {
  redirect('/plan')
}
