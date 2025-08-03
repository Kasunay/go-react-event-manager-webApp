import type React from "react"
import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router"
import {
  CalendarIcon,
  Clock,
  TicketIcon,
  User,
  Settings,
  LogOut,
  Download,
  Maximize2,
  Mail,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react"
import { Button } from "../components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Separator } from "../components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog"
import { Badge } from "../components/ui/badge"
import { Alert, AlertDescription } from "../components/ui/alert"
import { useAuth } from "../contexts/AuthContext"

// API Configuration
const API_BASE_URL = "http://localhost:8080"

// Define the Ticket interface
interface Ticket {
  id: string
  order_id: string
  ticket_type_id: number
  ticket_code: string
  code: string
  is_used: boolean
  created_at: string
  event_title: string
  ticket_type_name: string
  event_date?: string
  event_time?: string
  event_slug?: string
  event_location?: string
  event_image_url?: string
  ticket_price?: number
}

export default function UserProfilePage() {
  const [activeTab, setActiveTab] = useState("tickets")
  const { currentUser, logout, isVerified } = useAuth()
  const navigate = useNavigate()

  // State for fetching tickets
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // State for password change form
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmNewPassword, setConfirmNewPassword] = useState("")
  const [passwordChangeMessage, setPasswordChangeMessage] = useState("")
  const [passwordChangeError, setPasswordChangeError] = useState("")

  // State for email verification
  const [verificationLoading, setVerificationLoading] = useState(false)
  const [verificationMessage, setVerificationMessage] = useState("")
  const [verificationError, setVerificationError] = useState("")



  // State for delete account
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false)
  const [deleteAccountPassword, setDeleteAccountPassword] = useState("")
  const [deleteAccountError, setDeleteAccountError] = useState("")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoading(true)
        const res = await fetch(`${API_BASE_URL}/myTickets`, {
          credentials: "include",
        })
        if (!res.ok) {
          throw new Error("Failed to fetch tickets")
        }

        const data: Ticket[] = await res.json()

        if (Array.isArray(data)) {
          setTickets(data)
        } else {
          console.warn("API did not return an array of tickets. Received:", data)
          setTickets([])
          throw new Error("Invalid ticket data format received.")
        }
      } catch (err) {
        console.error("Failed to fetch tickets:", err)
        setError("Unable to load your tickets. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchTickets()
  }, [])

  const upcomingTickets = tickets.filter((ticket) => !ticket.is_used)
  const pastTickets = tickets.filter((ticket) => ticket.is_used)

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordChangeMessage("")
    setPasswordChangeError("")

    if (newPassword !== confirmNewPassword) {
      setPasswordChangeError("New password and confirmation do not match.")
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/user/update-password`, {
        credentials: "include",
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to update password")
      }

      setPasswordChangeMessage("Password updated successfully!")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmNewPassword("")
    } catch (error: any) {
      setPasswordChangeError(error.message)
    }
  }

  const handleSignOut = () => {
    logout()
    navigate("/")
  }

  const handleResendVerification = async () => {
    if (!currentUser?.email) {
      setVerificationError("No email address found")
      return
    }

    setVerificationLoading(true)
    setVerificationMessage("")
    setVerificationError("")

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/resend-verification`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: currentUser.email,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to send verification email")
      }

      setVerificationMessage("Verification email sent successfully! Please check your inbox and spam folder.")
    } catch (error: any) {
      setVerificationError(error.message || "Failed to send verification email")
    } finally {
      setVerificationLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!deleteAccountPassword.trim()) {
      setDeleteAccountError("Password is required to delete your account")
      return
    }

    setDeleteAccountLoading(true)
    setDeleteAccountError("")

    try {
      const response = await fetch(`${API_BASE_URL}/api/user/delete-account`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: deleteAccountPassword,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to delete account")
      }

      // Account deleted successfully - logout and redirect
      logout()
      navigate("/")
    } catch (error: any) {
      setDeleteAccountError(error.message || "Failed to delete account")
    } finally {
      setDeleteAccountLoading(false)
    }
  }

  const handleDeleteDialogClose = () => {
    setShowDeleteDialog(false)
    setDeleteAccountPassword("")
    setDeleteAccountError("")
  }

  const downloadQRCode = (ticket: Ticket) => {
    if (!ticket.ticket_code) return

    const link = document.createElement("a")
    link.href = `data:image/png;base64,${ticket.ticket_code}`
    link.download = `ticket-${ticket.code}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const TicketCard = ({ ticket, isPast = false }: { ticket: Ticket; isPast?: boolean }) => (
    <Card className={`overflow-hidden transition-all hover:shadow-lg ${isPast ? "opacity-75" : ""}`}>
      <CardContent className="p-0">
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_200px] gap-0">
          {/* QR Code Section */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900 p-6 flex flex-col items-center justify-center">
            <div className="bg-white p-4 rounded-xl shadow-lg">
              {ticket.ticket_code ? (
                <img
                  src={`data:image/png;base64,${ticket.ticket_code}`}
                  alt={`QR Code for ${ticket.event_title}`}
                  width={200}
                  height={200}
                  className="object-contain"
                />
              ) : (
                <div className="w-[200px] h-[200px] flex items-center justify-center bg-gray-100 rounded-lg">
                  <TicketIcon className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="mt-4 flex gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="bg-white/80 backdrop-blur">
                    <Maximize2 className="h-4 w-4 mr-1" />
                    Enlarge
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>QR Code - {ticket.event_title}</DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col items-center space-y-4">
                    <div className="bg-white p-6 rounded-xl">
                      {ticket.ticket_code && (
                        <img
                          src={`data:image/png;base64,${ticket.ticket_code}`}
                          alt={`QR Code for ${ticket.event_title}`}
                          width={300}
                          height={300}
                          className="object-contain"
                        />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground text-center">Show this QR code at the venue entrance</p>
                    <Button onClick={() => downloadQRCode(ticket)} className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Download QR Code
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadQRCode(ticket)}
                className="bg-white/80 backdrop-blur"
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            </div>
          </div>

          {/* Event Details Section */}
          <div className="p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{ticket.event_title}</h3>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">{ticket.ticket_type_name}</p>
                </div>
                <Badge
                  variant={ticket.is_used ? "secondary" : "default"}
                  className={
                    ticket.is_used
                      ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                      : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                  }
                >
                  {ticket.is_used ? "Used" : "Valid"}
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <CalendarIcon className="mr-3 h-4 w-4 text-blue-500" />
                  <span className="font-medium">
                    {new Date(ticket.created_at).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>

                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <Clock className="mr-3 h-4 w-4 text-blue-500" />
                  <span className="font-medium">
                    {new Date(ticket.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <TicketIcon className="mr-3 h-4 w-4 text-blue-500" />
                  <span className="font-medium">Ticket Code: {ticket.id}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">Order ID: {ticket.order_id}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Purchased: {new Date(ticket.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Action Section */}
          <div className="p-6 bg-gray-50 dark:bg-gray-800/50 flex flex-col justify-center items-center border-l border-gray-200 dark:border-gray-700">
            <Link to={`/events/${ticket.event_slug}`} className="w-full">
              <Button variant={isPast ? "outline" : "default"} className="w-full mb-3" size="lg">
                View Event
              </Button>
            </Link>
            {!isPast && (
              <Button variant="outline" size="sm" onClick={() => downloadQRCode(ticket)} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Download Ticket
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="container py-8 md:py-12">
      <div className="grid gap-8 md:grid-cols-[240px_1fr]">
        {/* Sidebar */}
        <div className="hidden md:block">
          <div className="flex flex-col gap-1">
            <Button
              variant={activeTab === "tickets" ? "default" : "ghost"}
              className="justify-start"
              onClick={() => setActiveTab("tickets")}
            >
              <TicketIcon className="mr-2 h-4 w-4" />
              My Tickets
            </Button>
            <Button
              variant={activeTab === "profile" ? "default" : "ghost"}
              className="justify-start"
              onClick={() => setActiveTab("profile")}
            >
              <User className="mr-2 h-4 w-4" />
              Profile
            </Button>
            <Button
              variant={activeTab === "settings" ? "default" : "ghost"}
              className="justify-start"
              onClick={() => setActiveTab("settings")}
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
            <Separator className="my-4" />
            <Button variant="ghost" className="justify-start text-muted-foreground" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Mobile Tabs */}
        <div className="md:hidden">
          <Tabs defaultValue="tickets" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="tickets">Tickets</TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Main Content */}
        <div>
          {activeTab === "tickets" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">My Tickets</h1>
                <div className="text-sm text-muted-foreground">
                  {tickets.length} ticket{tickets.length !== 1 ? "s" : ""} total
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading your tickets...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="text-center text-red-500 py-12">
                  <TicketIcon className="h-12 w-12 mx-auto mb-4 text-red-400" />
                  <p className="text-lg font-medium mb-2">Error Loading Tickets</p>
                  <p className="text-sm">{error}</p>
                </div>
              ) : (
                <Tabs defaultValue="upcoming" className="mt-6">
                  <TabsList className="mb-6">
                    <TabsTrigger value="upcoming" className="px-6">
                      Upcoming ({upcomingTickets.length})
                    </TabsTrigger>
                    <TabsTrigger value="past" className="px-6">
                      Past ({pastTickets.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="upcoming" className="mt-4">
                    {upcomingTickets.length > 0 ? (
                      <div className="space-y-6">
                        {upcomingTickets.map((ticket) => (
                          <TicketCard key={ticket.id} ticket={ticket} />
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-16 text-center">
                        <TicketIcon className="h-16 w-16 text-muted-foreground mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No upcoming tickets</h3>
                        <p className="text-muted-foreground mb-6 max-w-md">
                          You don't have any upcoming events. Browse events to find something you like.
                        </p>
                        <Link to="/events">
                          <Button size="lg">Browse Events</Button>
                        </Link>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="past" className="mt-4">
                    {pastTickets.length > 0 ? (
                      <div className="space-y-6">
                        {pastTickets.map((ticket) => (
                          <TicketCard key={ticket.id} ticket={ticket} isPast={true} />
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-16 text-center">
                        <TicketIcon className="h-16 w-16 text-muted-foreground mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No past tickets</h3>
                        <p className="text-muted-foreground">You haven't attended any events yet.</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              )}
            </div>
          )}

          {activeTab === "profile" && (
            <div>
              <h1 className="text-2xl font-bold md:text-3xl">My Profile</h1>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your personal information</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center gap-4 sm:flex-row">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={"/placeholder.svg"} alt={currentUser?.fullName} />
                      <AvatarFallback>{currentUser?.fullName?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" defaultValue={currentUser?.fullName} />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" defaultValue={currentUser?.email} readOnly />
                      </div>

                      {/* Enhanced Email Verification Status */}
                      <div className="grid gap-3">
                        <Label>Email Verification Status</Label>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-4 rounded-lg border bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                            <div className="flex items-center space-x-3">
                              {isVerified() ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              ) : (
                                <AlertCircle className="h-5 w-5 text-amber-500" />
                              )}
                              <div>
                                <div className="text-left font-medium">
                                  {isVerified() ? "Email Verified" : "Email Not Verified"}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {isVerified()
                                    ? "Your email address has been verified"
                                    : "Please verify your email to access all features"}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge
                                variant={isVerified() ? "default" : "destructive"}
                                className={`${
                                  isVerified() ? "bg-green-500 hover:bg-green-600" : "bg-amber-500 hover:bg-amber-600"
                                } text-white`}
                              >
                                {isVerified() ? "Verified" : "Unverified"}
                              </Badge>
                              {!isVerified() && (
                                <Button
                                  onClick={handleResendVerification}
                                  size="sm"
                                  disabled={verificationLoading}
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  {verificationLoading ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Sending...
                                    </>
                                  ) : (
                                    <>
                                      <Mail className="h-4 w-4 mr-2" />
                                      Verify Now
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Verification Messages */}
                          {verificationMessage && (
                            <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <AlertDescription className="text-green-800 dark:text-green-200">
                                {verificationMessage}
                              </AlertDescription>
                            </Alert>
                          )}

                          {verificationError && (
                            <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
                              <AlertCircle className="h-4 w-4 text-red-600" />
                              <AlertDescription className="text-red-800 dark:text-red-200">
                                {verificationError}
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input id="phone" type="tel" />
                      </div>
                      <Button>Save Changes</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "settings" && (
            <div>
              <h1 className="text-2xl font-bold md:text-3xl">Settings</h1>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                  <CardDescription>Manage your account settings and preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="font-medium">Email Notifications</h3>
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <div className="font-medium">Event Reminders</div>
                        <div className="text-sm text-muted-foreground">Receive reminders about upcoming events</div>
                      </div>
                      <div className="ml-auto flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          Disable
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <div className="font-medium">Promotional Emails</div>
                        <div className="text-sm text-muted-foreground">Receive emails about new events and offers</div>
                      </div>
                      <div className="ml-auto flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          Enable
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h3 className="font-medium">Password</h3>
                    <form onSubmit={handlePasswordUpdate} className="space-y-4 rounded-lg border p-4">
                      <div className="grid gap-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input
                          id="currentPassword"
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          required
                        />
                      </div>
                      {passwordChangeError && <p className="text-sm text-red-500">{passwordChangeError}</p>}
                      {passwordChangeMessage && <p className="text-sm text-green-500">{passwordChangeMessage}</p>}
                      <Button type="submit">Update Password</Button>
                    </form>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h3 className="font-medium">Danger Zone</h3>
                    <div className="rounded-lg border border-destructive/20 p-4 bg-red-50/50 dark:bg-red-950/10">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-destructive">Delete Account</div>
                          <div className="text-sm text-muted-foreground">
                            Permanently delete your account and all data. This action cannot be undone.
                          </div>
                        </div>
                        <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
                          Delete Account
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Delete Account Confirmation Dialog */}
                  <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                          <AlertCircle className="h-5 w-5" />
                          Delete Account
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <AlertDescription className="text-red-800 dark:text-red-200">
                            <strong>Warning:</strong> This action is permanent and cannot be undone. All your data,
                            including tickets, will be permanently deleted.
                          </AlertDescription>
                        </Alert>

                        <div className="space-y-2">
                          <Label htmlFor="deletePassword">Enter your password to confirm</Label>
                          <Input
                            id="deletePassword"
                            type="password"
                            placeholder="Enter your password"
                            value={deleteAccountPassword}
                            onChange={(e) => setDeleteAccountPassword(e.target.value)}
                            className="border-red-200 focus:border-red-500 focus:ring-red-500"
                          />
                        </div>

                        {deleteAccountError && (
                          <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <AlertDescription className="text-red-800 dark:text-red-200">
                              {deleteAccountError}
                            </AlertDescription>
                          </Alert>
                        )}

                        <div className="flex gap-3 pt-4">
                          <Button
                            variant="outline"
                            onClick={handleDeleteDialogClose}
                            className="flex-1"
                            disabled={deleteAccountLoading}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={handleDeleteAccount}
                            className="flex-1"
                            disabled={deleteAccountLoading || !deleteAccountPassword.trim()}
                          >
                            {deleteAccountLoading ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Deleting...
                              </>
                            ) : (
                              "Delete Account"
                            )}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
