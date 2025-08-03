import type React from "react"

import { useState } from "react"
import { Link } from "react-router"
import { Mail } from "lucide-react"
import { toast } from "sonner"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { useAuth } from "../contexts/AuthContext"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const { forgotPassword } = useAuth()

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setIsSubmitting(true)

  try {
    // Basic validation
    if (!email) {
      setSuccessMessage("")
      toast.error("Email is required")
      setIsSubmitting(false)
      return
    }

    await forgotPassword(email)
    setSuccessMessage("Password reset link has been sent to your email. Please check your inbox.")
    setEmail("")
  } catch (err) {
    setSuccessMessage("")
    toast.error(err instanceof Error ? err.message : "An unexpected error occurred")
  } finally {
    setIsSubmitting(false)
  }
}

  return (
    <div className="container flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center py-8 md:py-12">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Forgot password</h1>
          <p className="text-sm text-muted-foreground">
            Enter your email address and we'll send you a link to reset your password
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {successMessage && (
            <div className="text-sm text-green-600 text-center bg-green-50 p-3 rounded-md border border-green-200">
              {successMessage}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                className="pl-9"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Send reset link"}
          </Button>
          <div className="text-center text-sm">
            <Link to="/login" className="text-muted-foreground hover:text-primary">
              Back to login
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
