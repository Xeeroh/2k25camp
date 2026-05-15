import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function Page() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: todos, error } = await supabase.from('todos').select()
  
  if (error) {
    // Probablemente no haya tabla 'todos', así que probemos con 'attendees' para validar
    const { data: attendees } = await supabase.from('attendees').select('*').limit(5)
    return (
      <div className="p-10 bg-try min-h-screen text-white">
        <h1 className="text-2xl font-bold mb-4">Prueba de Supabase SSR</h1>
        <p className="mb-4">Este componente se renderiza en el servidor usando los nuevos helpers.</p>
        <ul className="space-y-2">
          {attendees?.map((attendee: any) => (
            <li key={attendee.id} className="p-2 border border-blue-500/50 rounded">
              {attendee.firstname} {attendee.lastname} - {attendee.email}
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <ul className="p-10">
      {todos?.map((todo: any) => (
        <li key={todo.id}>{todo.name}</li>
      ))}
    </ul>
  )
}
