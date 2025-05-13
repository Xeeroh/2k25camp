"use client";

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { AlertCircle, Loader2 } from "lucide-react"

interface LoginFormProps {
  onLogin?: (userData: { email: string }) => void
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { signIn, loading: authLoading } = useAuth()
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      setErrorMessage("Por favor ingresa tu correo y contraseña")
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMessage(null)
      
      console.log('Intentando iniciar sesión...')
      await signIn(email, password)
      
      console.log('Inicio de sesión exitoso')
      toast.success("Inicio de sesión exitoso")
      
      if (onLogin) {
        onLogin({ email })
      }
    } catch (error: any) {
      console.error('Error en inicio de sesión:', error)
      
      // Mensajes de error específicos
      if (error?.message?.includes('Invalid login credentials')) {
        setErrorMessage("Credenciales inválidas. Verifica tu correo y contraseña.")
      } else if (error?.message?.includes('Invalid email')) {
        setErrorMessage("Formato de correo inválido. Verifica tu correo.")
      } else if (error?.message?.includes('network') || error?.message?.includes('Failed to fetch')) {
        setErrorMessage("Error de conexión. Comprueba tu conexión a internet.")
      } else {
        setErrorMessage(`Error: ${error?.message || 'Desconocido'}`)
      }
      
      toast.error("Error al iniciar sesión")
    } finally {
      setIsSubmitting(false)
    }
  }

  const isLoading = isSubmitting || authLoading

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMessage && (
        <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm flex items-start">
          <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="email">Correo electrónico</Label>
        <Input
          id="email"
          type="email"
          placeholder="correo@ejemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
          autoComplete="email"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
          autoComplete="current-password"
        />
      </div>

      <Button 
        type="submit" 
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Iniciando sesión...
          </>
        ) : (
          "Iniciar sesión"
        )}
      </Button>
    </form>
  )
}