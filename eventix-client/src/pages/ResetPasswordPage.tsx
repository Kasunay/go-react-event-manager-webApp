import type React from "react"
import { useState, useEffect } from "react"
import { Link, useSearchParams, useNavigate } from "react-router"
import { Lock, CheckCircle, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get("token")

  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // Validate token on component mount
  useEffect(() => {
    if (!token) {
      toast.error("Invalid or missing reset token. Please request a new password reset.")
    }
  }, [token])

  // Password validation
  const validatePassword = (password: string): string[] => {
    const errors: string[] = []

    if (password.length < 8) {
      errors.push("Password must be at least 8 characters long")
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter")
    }
    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter")
    }
    if (!/\d/.test(password)) {
      errors.push("Password must contain at least one number")
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push("Password must contain at least one special character")
    }

    return errors
  }

  // Handle password input change
  const handlePasswordChange = (value: string) => {
    setNewPassword(value)
    setValidationErrors(validatePassword(value))
    // setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate inputs
      if (!token) {
        throw new Error("Invalid reset token")
      }

      if (!newPassword || !confirmPassword) {
        throw new Error("Please fill in all fields")
      }

      if (newPassword !== confirmPassword) {
        throw new Error("Passwords do not match")
      }

      const passwordErrors = validatePassword(newPassword)
      if (passwordErrors.length > 0) {
        throw new Error("Please fix the password requirements")
      }

      // Call backend API
      const response = await fetch("http://localhost:8080/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: token,
          newPassword: newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset password")
      }

      setIsSuccess(true)
      toast.success("Password reset successful! Redirecting to login...")

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login")
      }, 3000)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="container flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center py-8 md:py-12">
        <Card className="mx-auto w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl font-semibold">Password Reset Successful</CardTitle>
            <CardDescription>
              Your password has been successfully updated. You will be redirected to the login page shortly.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link to="/login">Go to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center py-8 md:py-12">
      <Card className="mx-auto w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-semibold">Reset Your Password</CardTitle>
          <CardDescription>
            Enter your new password below. Make sure it meets all the security requirements.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  className="pl-9 pr-9"
                  value={newPassword}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  disabled={isSubmitting}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isSubmitting}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>

              {/* Password requirements */}
              {newPassword && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-muted-foreground">Password requirements:</p>
                  <ul className="space-y-1 text-xs">
                    <li
                      className={`flex items-center gap-1 ${newPassword.length >= 8 ? "text-green-600" : "text-muted-foreground"}`}
                    >
                      <div
                        className={`h-1 w-1 rounded-full ${newPassword.length >= 8 ? "bg-green-600" : "bg-muted-foreground"}`}
                      />
                      At least 8 characters
                    </li>
                    <li
                      className={`flex items-center gap-1 ${/[A-Z]/.test(newPassword) ? "text-green-600" : "text-muted-foreground"}`}
                    >
                      <div
                        className={`h-1 w-1 rounded-full ${/[A-Z]/.test(newPassword) ? "bg-green-600" : "bg-muted-foreground"}`}
                      />
                      One uppercase letter
                    </li>
                    <li
                      className={`flex items-center gap-1 ${/[a-z]/.test(newPassword) ? "text-green-600" : "text-muted-foreground"}`}
                    >
                      <div
                        className={`h-1 w-1 rounded-full ${/[a-z]/.test(newPassword) ? "bg-green-600" : "bg-muted-foreground"}`}
                      />
                      One lowercase letter
                    </li>
                    <li
                      className={`flex items-center gap-1 ${/\d/.test(newPassword) ? "text-green-600" : "text-muted-foreground"}`}
                    >
                      <div
                        className={`h-1 w-1 rounded-full ${/\d/.test(newPassword) ? "bg-green-600" : "bg-muted-foreground"}`}
                      />
                      One number
                    </li>
                    <li
                      className={`flex items-center gap-1 ${/[!@#$%^&*(),.?":{}|<>]/.test(newPassword) ? "text-green-600" : "text-muted-foreground"}`}
                    >
                      <div
                        className={`h-1 w-1 rounded-full ${/[!@#$%^&*(),.?":{}|<>]/.test(newPassword) ? "bg-green-600" : "bg-muted-foreground"}`}
                      />
                      One special character
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  className="pl-9 pr-9"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isSubmitting}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isSubmitting}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>

              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-red-600">Passwords do not match</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={
                isSubmitting ||
                !newPassword ||
                !confirmPassword ||
                newPassword !== confirmPassword ||
                validationErrors.length > 0 ||
                !token
              }
            >
              {isSubmitting ? "Resetting Password..." : "Reset Password"}
            </Button>

            <div className="text-center text-sm">
              <Link to="/login" className="text-muted-foreground hover:text-primary">
                Back to login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}