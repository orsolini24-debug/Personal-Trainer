import { auth } from "@/auth"
import { redirect } from "next/navigation"
import ChatClient from "./chat-client"

export default async function CoachPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)] flex flex-col pb-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">AI Coach</h1>
        <p className="text-zinc-500 text-sm">Il tuo assistente personale basato sui tuoi dati.</p>
      </div>
      
      <div className="flex-1 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col">
        <ChatClient />
      </div>
    </div>
  )
}