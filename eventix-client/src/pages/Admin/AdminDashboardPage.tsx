import { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { Navigate } from "react-router"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Badge } from "../../components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar"
import { Alert, AlertDescription } from "../../components/ui/alert"
import { Search, Plus, Edit, Users, Calendar, BarChart3, Trash2, Loader2, Receipt } from "lucide-react"
import type { User, CreateUserRequest, UpdateUserRequest } from "../../types/user"
import type { Event, CreateEventRequest, UpdateEventRequest } from "../../types/event"
import { UserEditDialog } from "../../components/admin/UserEditDialog"
import { UserCreateDialog } from "../../components/admin/UserCreateDialog"
import { EventCreateDialog } from "../../components/admin/EventCreateDialog"
import { EventEditDialog } from "../../components/admin/EventEditDialog"
import { EventOrdersDialog } from "../../components/admin/EventOrdersDialog"

export default function AdminDashboardPage() {
  const BASE_URL = "http://localhost:8080"
  
  const { isLoggedIn, isAdmin, isCreator, isLoading } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [userSearch, setUserSearch] = useState("")
  const [eventSearch, setEventSearch] = useState("")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [userEditOpen, setUserEditOpen] = useState(false)
  const [userCreateOpen, setUserCreateOpen] = useState(false)
  const [eventEditOpen, setEventEditOpen] = useState(false)
  const [eventCreateOpen, setEventCreateOpen] = useState(false)
  const [usersLoading, setUsersLoading] = useState(true)
  const [eventsLoading, setEventsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [eventsError, setEventsError] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  const [eventDeleteLoading, setEventDeleteLoading] = useState<string | null>(null)
  const [selectedEventForOrders, setSelectedEventForOrders] = useState<Event | null>(null)
  const [ordersDialogOpen, setOrdersDialogOpen] = useState(false)

  // Check if user can access dashboard
  const canAccessDashboard = isAdmin() || isCreator()

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setUsersLoading(true)
      setError(null)

      const response = await fetch(`${BASE_URL}/api/admin/users`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch users")
      }

      const data = await response.json()
      setUsers(data || [])
    } catch (err: any) {
      setError(err.message || "Failed to load users")
      console.error("Error fetching users:", err)
    } finally {
      setUsersLoading(false)
    }
  }

  const fetchEvents = async () => {
    try {
      setEventsLoading(true)
      setEventsError(null)

      const url = new URL(`${BASE_URL}/api/admin/events`)
      if (eventSearch) {
        url.searchParams.set("search", eventSearch)
      }

      const response = await fetch(url.toString(), {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch events")
      }

      const data = await response.json()
      setEvents(data || [])
    } catch (err: any) {
      setEventsError(err.message || "An error occurred while fetching events.")
      console.error("Error fetching events:", err)
      setEvents([])
    } finally {
      setEventsLoading(false)
    }
  }

  // Refetch events when search changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchEvents()
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [eventSearch])

  useEffect(() => {
    if (canAccessDashboard) {
      if (isAdmin()) {
        fetchUsers()
      }
      fetchEvents()
    }
  }, [canAccessDashboard])

  // Show loading spinner while auth is loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading...</span>
      </div>
    )
  }

  // Redirect if not authenticated or not admin/creator
  if (!isLoggedIn || !canAccessDashboard) {
    return <Navigate to="/" replace />
  }

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(userSearch.toLowerCase()) ||
      user.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      user.role.toLowerCase().includes(userSearch.toLowerCase()),
  )

  const handleUserEdit = (user: User) => {
    setSelectedUser(user)
    setUserEditOpen(true)
  }

  const handleUserSave = async (userId: string, data: UpdateUserRequest) => {
    try {

        const requestData = {
      ...data,
      id: userId
    }
      const response = await fetch(`${BASE_URL}/api/admin/users-update`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
         body: JSON.stringify(requestData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to update user")
      }

      await fetchUsers()
    } catch (err: any) {
      throw new Error(err.message || "Failed to update user")
    }
  }

  const handleUserCreate = async (data: CreateUserRequest) => {
    try {
      const response = await fetch(`${BASE_URL}/api/admin/users`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to create user")
      }

      await fetchUsers()
    } catch (err: any) {
      throw new Error(err.message || "Failed to create user")
    }
  }

  const handleUserDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return
    }

    try {
      setDeleteLoading(userId)

      const response = await fetch(`${BASE_URL}/api/admin/users/${userId}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to delete user")
      }

      await fetchUsers()
    } catch (err: any) {
      alert(`Error deleting user: ${err.message}`)
      console.error("Error deleting user:", err)
    } finally {
      setDeleteLoading(null)
    }
  }

  const handleEventEdit = (event: Event) => {
    setSelectedEvent(event)
    setEventEditOpen(true)
  }

  const handleEventSave = async (eventId: string, data: UpdateEventRequest) => {
    try {
      const response = await fetch(`${BASE_URL}/api/admin/events/${eventId}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to update event")
      }

      await fetchEvents()
    } catch (err: any) {
      throw new Error(err.message || "Failed to update event")
    }
  }

  const handleEventCreate = async (data: CreateEventRequest) => {
    try {
      const response = await fetch(`${BASE_URL}/api/admin/events`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to create event")
      }

      await fetchEvents()
    } catch (err: any) {
      throw new Error(err.message || "Failed to create event")
    }
  }

  const handleEventDelete = async (eventId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this event? This action cannot be undone and will delete all associated tickets and orders.",
      )
    ) {
      return
    }

    try {
      setEventDeleteLoading(eventId)

      const response = await fetch(`${BASE_URL}/admin/event/${eventId}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to delete event")
      }

      await fetchEvents()
    } catch (err: any) {
      alert(`Error deleting event: ${err.message}`)
      console.error("Error deleting event:", err)
    } finally {
      setEventDeleteLoading(null)
    }
  }

  const handleViewOrders = (event: Event) => {
    setSelectedEventForOrders(event)
    setOrdersDialogOpen(true)
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive"
      case "creator":
        return "default"
      default:
        return "secondary"
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{isCreator() ? "Creator Dashboard" : "Admin Dashboard"}</h1>
        <p className="text-muted-foreground">
          {isCreator() ? "Manage your events and view analytics" : "Manage users, events and system settings"}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        {isAdmin() && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
              <p className="text-xs text-muted-foreground">
                {users.filter((u) => u.is_email_verified).length} verified
              </p>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.length}</div>
            <p className="text-xs text-muted-foreground">{events.filter((e) => e.is_published).length} published</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published Events</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.filter((e) => e.is_published).length}</div>
            <p className="text-xs text-muted-foreground">{events.filter((e) => !e.is_published).length} drafts</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue={isCreator() ? "events" : "users"} className="space-y-4">
        <TabsList>
          {isAdmin() && <TabsTrigger value="users">Users Management</TabsTrigger>}
          <TabsTrigger value="events">Events Management</TabsTrigger>
        </TabsList>

        {isAdmin() && (
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Users Management</CardTitle>
                    <CardDescription>View and manage user accounts</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search users..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="pl-8 w-[300px]"
                      />
                    </div>
                    <Button onClick={() => setUserCreateOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add User
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {usersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="ml-2">Loading users...</span>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Verified</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="flex items-center space-x-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src="/placeholder.svg" />
                              <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span>{user.username}</span>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant={getRoleBadgeVariant(user.role)}>{user.role}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.is_email_verified ? "default" : "secondary"}>
                              {user.is_email_verified ? "Yes" : "No"}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button variant="ghost" size="sm" onClick={() => handleUserEdit(user)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUserDelete(user.id)}
                                disabled={deleteLoading === user.id}
                              >
                                {deleteLoading === user.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Events Management</CardTitle>
                  <CardDescription>View, edit, and create events</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search events..."
                      value={eventSearch}
                      onChange={(e) => setEventSearch(e.target.value)}
                      className="pl-8 w-[300px]"
                    />
                  </div>
                  <Button onClick={() => setEventCreateOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Event
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {eventsError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{eventsError}</AlertDescription>
                </Alert>
              )}

              {eventsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Loading events...</span>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Start Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                      <TableHead>Orders</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell className="font-medium">{event.title}</TableCell>
                        <TableCell className="font-mono text-sm">{event.slug}</TableCell>
                        <TableCell>{new Date(event.start_time).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={event.is_published ? "default" : "secondary"}>
                            {event.is_published ? "Published" : "Draft"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {event.created_at ? new Date(event.created_at).toLocaleDateString() : "N/A"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEventEdit(event)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEventDelete(event.id)}
                              disabled={eventDeleteLoading === event.id}
                            >
                              {eventDeleteLoading === event.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => handleViewOrders(event)}>
                            <Receipt className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      {isAdmin() && (
        <>
          <UserEditDialog
            user={selectedUser}
            open={userEditOpen}
            onOpenChange={setUserEditOpen}
            onSave={handleUserSave}
          />
          <UserCreateDialog open={userCreateOpen} onOpenChange={setUserCreateOpen} onCreate={handleUserCreate} />
        </>
      )}
      <EventEditDialog
        event={selectedEvent}
        open={eventEditOpen}
        onOpenChange={setEventEditOpen}
        onSave={handleEventSave}
      />
      <EventCreateDialog open={eventCreateOpen} onOpenChange={setEventCreateOpen} onCreate={handleEventCreate} />
      <EventOrdersDialog
        eventId={selectedEventForOrders?.id || null}
        eventTitle={selectedEventForOrders?.title || ""}
        open={ordersDialogOpen}
        onOpenChange={setOrdersDialogOpen}
      />
    </div>
  )
}
