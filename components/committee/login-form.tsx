"use client";

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { AlertCircle, Loader2, RefreshCw } from "lucide-react"

interface LoginFormProps {
  onLogin?: (userData: { email: string }) => void
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isFormSubmitting, setIsFormSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showRetry, setShowRetry] = useState(false)
  const { signIn, loading } = useAuth()
  
  // Efecto para mostrar mensaje cuando el estado de carga dura demasiado
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    if (loading && isFormSubmitting) {
      timeoutId = setTimeout(() => {
        toast.info("El inicio de sesión está tardando más de lo normal, por favor espere...");
        setShowRetry(true);
      }, 5000); // 5 segundos
    } else {
      setShowRetry(false);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [loading, isFormSubmitting]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await performLogin()
  }
  
  const performLogin = async () => {
    setIsFormSubmitting(true)
    setErrorMessage(null)
    setShowRetry(false)

    if (!email || !password) {
      setErrorMessage("Por favor ingresa tu correo y contraseña")
      setIsFormSubmitting(false)
      return
    }

    try {
      // Utilizar el hook de autenticación para iniciar sesión
      await signIn(email, password)
      
      // Notificar al componente padre si es necesario
      if (onLogin) {
        onLogin({ email })
      }
      
      toast.success("Inicio de sesión exitoso")
    } catch (error: any) {
      // Registrar error detallado para depuración
      console.log('Error detallado al iniciar sesión:', error)
      
      // Manejar el mensaje de error según el tipo de error
      if (error?.message?.includes('Invalid login credentials')) {
        setErrorMessage("Credenciales inválidas. Por favor, verifica tu correo y contraseña.")
      } else if (error?.message?.includes('Invalid email')) {
        setErrorMessage("Formato de correo inválido. Por favor, verifica tu correo.")
      } else if (error?.message?.includes('network') || error?.message?.includes('Failed to fetch')) {
        setErrorMessage("Error de conexión. Comprueba tu conexión a internet e intenta nuevamente.")
        setShowRetry(true)
      } else if (error?.message?.includes('Timeout') || error?.message?.includes('tardó demasiado tiempo')) {
        setErrorMessage("La conexión tardó demasiado tiempo. Por favor, intenta nuevamente.")
        setShowRetry(true)
      } else {
        // Mensaje genérico con información del error para ayudar a depurar
        setErrorMessage(`Error al iniciar sesión: ${error?.message || 'Desconocido'}`)
        setShowRetry(true)
      }
      
      toast.error("Error al iniciar sesión")
    } finally {
      setIsFormSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {loading && (
        <div className="bg-primary/10 text-primary p-3 rounded-md text-sm flex items-start mb-4">
          <Loader2 className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0 animate-spin" />
          <span>Iniciando sesión, por favor espere...</span>
        </div>
      )}
      
      {errorMessage && (
        <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm flex items-start">
          <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
          <span>{errorMessage}</span>
          
          {showRetry && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => performLogin()}
              className="ml-auto"
              type="button"
              disabled={loading || isFormSubmitting}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Reintentar
            </Button>
          )}
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
          disabled={loading}
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
          disabled={loading}
        />
      </div>

      <Button 
        type="submit" 
        className="w-full"
        disabled={loading || isFormSubmitting}
      >
        {loading || isFormSubmitting ? (
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