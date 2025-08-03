"use client"

import { useState, useEffect } from "react"
import { Button } from "../../components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { Badge } from "../../components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Alert, AlertDescription } from "../../components/ui/alert"
import { Loader2, Receipt, Ticket, Download, Eye } from "lucide-react"
import { apiService, type OrderInfo, type AdminTicketInfo } from "../../services/api"
import { toast } from "sonner"
import { format } from "date-fns"

interface EventOrdersDialogProps {
  eventId: string | null
  eventTitle: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EventOrdersDialog({ eventId, eventTitle, open, onOpenChange }: EventOrdersDialogProps) {
  const [orders, setOrders] = useState<OrderInfo[]>([])
  const [tickets, setTickets] = useState<AdminTicketInfo[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ticketsLoading, setTicketsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch orders and tickets when dialog opens
  useEffect(() => {
    if (open && eventId) {
      fetchOrdersAndTickets()
    }
  }, [open, eventId])

  const fetchOrdersAndTickets = async () => {
    if (!eventId) return

    setError(null)
    setOrdersLoading(true)
    setTicketsLoading(true)

    try {
      const [ordersData, ticketsData] = await Promise.all([
        apiService.getEventOrders(eventId),
        apiService.getEventTickets(eventId),
      ])

      setOrders(ordersData|| [])
      setTickets(ticketsData || [])
    } catch (err: any) {
      setError(err.message || "Failed to load orders and tickets")
      toast.error("Failed to load event data")
    } finally {
      setOrdersLoading(false)
      setTicketsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return <Badge variant="default">Completed</Badge>
      case "pending":
        return <Badge variant="secondary">Pending</Badge>
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTicketStatusBadge = (isUsed: boolean) => {
    return isUsed ? <Badge variant="secondary">Used</Badge> : <Badge variant="default">Valid</Badge>
  }

  const totalRevenue = orders.reduce((sum, order) => (sum + order.totalAmount)/100, 0)
  const totalTicketsSold = tickets.length
  const usedTickets = tickets.filter((t) => t.is_used).length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Orders & Tickets - {eventTitle}
          </DialogTitle>
          <DialogDescription>View and manage orders and tickets for this event</DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(totalRevenue / 100).toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">{orders.length} orders</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tickets Sold</CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTicketsSold}</div>
              <p className="text-xs text-muted-foreground">{usedTickets} used</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usage Rate</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalTicketsSold > 0 ? Math.round((usedTickets / totalTicketsSold) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">tickets used</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="orders" className="space-y-4">
          <TabsList>
            <TabsTrigger value="orders">Orders ({orders.length})</TabsTrigger>
            <TabsTrigger value="tickets">Tickets ({tickets.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Order History</h3>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Orders
              </Button>
            </div>

            {ordersLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading orders...</span>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment Ref</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-sm">{order.id.slice(0, 8)}...</TableCell>
                      <TableCell>{order.buyer_email}</TableCell>
                     <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell className="font-medium">${(order.totalAmount / 10000).toFixed(2)}</TableCell>
                      <TableCell className="font-mono text-sm">{order.paymentRef ? `${order.paymentRef.slice(0, 12)}...` : "N/A"}</TableCell>
                      <TableCell>{order.createdAt ? format(new Date(order.createdAt), "MMM d, yyyy HH:mm") : "N/A"}</TableCell>
                    </TableRow>
                  ))}
                  {orders.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No orders found for this event
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="tickets" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Ticket Details</h3>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Tickets
              </Button>
            </div>

            {ticketsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading tickets...</span>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>QR Code</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-mono text-sm">{ticket.id.slice(0, 8)}...</TableCell>
                      <TableCell>{ticket.ticket_type_name}</TableCell>
                      <TableCell>{ticket.user_email}</TableCell>
                      <TableCell>{getTicketStatusBadge(ticket.is_used)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      <TableCell>{ticket.created_at ? format(new Date(ticket.created_at), "MMM d, yyyy HH:mm") : "N/A"}</TableCell>
                    </TableRow>
                  ))}
                  {tickets.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No tickets found for this event
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
