import ChatWidget from '@/components/ChatWidget'
import { supabase } from '@/lib/supabase'

export default async function AssistantPage() {
  const { data } = await supabase.auth.getUser()

  if (!data.user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-black">
        Please login to use the assistant.
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black p-8">
      <ChatWidget userId={data.user.id} />
    </div>
  )
}