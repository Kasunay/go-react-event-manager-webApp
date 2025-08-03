"use client"

import type React from "react"

import { useState } from "react"
import { Link, useNavigate } from "react-router"
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Separator } from "../components/ui/separator"
import { Checkbox } from "../components/ui/checkbox"
import { useAuth } from "../contexts/AuthContext" // Ensure this path is correct
import { toast } from "sonner"

export default function SignupPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const { signup, isLoading } = useAuth() // Get signup and isLoading from AuthContext
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // Basic client-side validation
      if (!name) {
        toast.error("Full Name is required")
        return
      }
      if (!email) {
        toast.error("Email is required")
        return
      }
      if (!password) {
        toast.error("Password is required")
        return
      }
      if (password !== confirmPassword) {
        toast.error("Passwords do not match")
        return
      }
      if (!acceptTerms) {
        toast.error("You must accept the terms and conditions")
        return
      }

      // The backend handles the specific password complexity checks,
      // but you can keep a basic check here for immediate feedback if desired.
      // For more precise client-side validation, you'd replicate the backend's regex.
      // For simplicity, we'll let the backend provide detailed password errors.

      await signup(name, email, password)
      toast.success("Account created! Please check your email to verify.")
      // On successful signup, navigate to a login page or a verification message page.
      // Your backend sends a verification email, so redirecting to login or
      // a "check your email" page is appropriate.
      navigate("/login?message=signup_success") // Or a dedicated page for email verification
    } catch (err) {
      // The signup function in AuthContext will re-throw the error from the backend
      const message = err instanceof Error ? err.message : "An unexpected error occurred"
      toast.error(message)
    }
  }

  // Use the isLoading state from AuthContext to disable the form
  const isFormDisabled = isLoading

  return (
    <div className="container flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center py-8 md:py-12">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
          <p className="text-sm text-muted-foreground">Enter your information to create an account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                className="pl-9"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isFormDisabled}
              />
            </div>
          </div>
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
                disabled={isFormDisabled}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="pl-9 pr-9"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isFormDisabled}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-10 w-10 px-3 py-2"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isFormDisabled}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
              </Button>
            </div>
            {/* Display backend's password complexity rules */}
            <p className="text-xs text-muted-foreground">
              Password must be at least 8 characters long, contain uppercase, lowercase, number, and a special character (!@#$%^&*.){" "}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                className="pl-9 pr-9"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isFormDisabled}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-10 w-10 px-3 py-2"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isFormDisabled}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="sr-only">{showConfirmPassword ? "Hide password" : "Show password"}</span>
              </Button>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="terms"
              checked={acceptTerms}
              onCheckedChange={(checked) => setAcceptTerms(checked === true)}
              disabled={isFormDisabled}
            />
            <Label htmlFor="terms" className="text-sm leading-none">
              I agree to the{" "}
              <Link to="/terms" className="text-primary underline-offset-4 hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link to="/privacy" className="text-primary underline-offset-4 hover:underline">
                Privacy Policy
              </Link>
            </Label>
          </div>
          <Button type="submit" className="w-full" disabled={isFormDisabled}>
            {isLoading ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button variant="outline" disabled={isFormDisabled}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="mr-2 h-4 w-4" fill="currentColor">
              <path d="M20.283 10.356h-8.327v3.451h4.792c-.446 2.193-2.313 3.453-4.792 3.453a5.27 5.27 0 0 1-5.279-5.28 5.27 5.27 0 0 1 5.279-5.279c1.259 0 2.397.447 3.29 1.178l2.6-2.599c-1.584-1.381-3.615-2.233-5.89-2.233a8.908 8.908 0 0 0-8.934 8.934 8.907 8.907 0 0 0 8.934 8.934c4.467 0 8.529-3.249 8.529-8.934 0-.528-.081-1.097-.202-1.625z"></path>
            </svg>
            Google
          </Button>
          <Button variant="outline" disabled={isFormDisabled}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="mr-2 h-4 w-4" fill="currentColor">
              <path d="M12.001 2C6.47813 2 2.00098 6.47715 2.00098 12C2.00098 16.4183 4.86566 20.1253 8.83807 21.4903C9.33847 21.5819 9.50191 21.2733 9.50191 21.0133C9.50191 20.7791 9.49309 20.0633 9.48895 19.2043C6.67559 19.8033 6.07559 17.9684 6.07559 17.9684C5.61406 16.8014 4.96941 16.4934 4.96941 16.4934C4.07813 15.8723 5.03941 15.8853 5.03941 15.8853C6.02753 15.9583 6.56941 16.9224 6.56941 16.9224C7.46566 18.4584 8.95191 18.0153 9.52191 17.7653C9.61254 17.1113 9.87813 16.6684 10.1688 16.4194C7.95504 16.1684 5.61941 15.3063 5.61941 11.4773C5.61941 10.3863 6.01941 9.49235 6.59066 8.79435C6.48441 8.54535 6.12566 7.52235 6.69066 6.14635C6.69066 6.14635 7.53066 5.88135 9.47691 7.17535C10.2875 6.95835 11.1516 6.84935 12.0094 6.84535C12.8672 6.84935 13.7312 6.95835 14.5438 7.17535C16.4891 5.88135 17.3281 6.14635 17.3281 6.14635C17.8938 7.52235 17.5344 8.54535 17.4281 8.79435C18.0016 9.49235 18.3984 10.3863 18.3984 11.4773C18.3984 15.3184 16.0594 16.1654 13.8375 16.4104C14.1984 16.7164 14.5234 17.3233 14.5234 18.2583C14.5234 19.6033 14.5109 20.6844 14.5109 21.0133C14.5109 21.2763 14.6719 21.5883 15.1797 21.4883C19.1422 20.1213 22.0016 16.4163 22.0016 12.0003C22.0016 6.47715 17.5234 2 12.001 2Z"></path>
            </svg>
            GitHub
          </Button>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-primary underline-offset-4 hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}