"use client"

import { useState, useEffect } from "react"
import { useSearchParams, Link } from "react-router"
import { CheckCircle, Download, Calendar, Share2, ArrowLeft, Mail, QrCode } from "lucide-react"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { Separator } from "../components/ui/separator"
import { toast } from "sonner"
import { format } from "date-fns"
import { apiService, type OrderResponse, type EventDetail } from "../services/api"
import { useAuth } from "../contexts/AuthContext"

export default function CheckoutSuccessPage() {
  const [searchParams] = useSearchParams()
  const { currentUser } = useAuth()
  const [order, setOrder] = useState<OrderResponse | null>(null)
  const [event, setEvent] = useState<EventDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [processingPayment, setProcessingPayment] = useState(true)

  const sessionId = searchParams.get("session_id")

  useEffect(() => {
    const processPayment = async () => {
      if (!sessionId || !currentUser) {
        setLoading(false)
        setProcessingPayment(false)
        return
      }

      try {
        // First, try to get existing order
        try {
          const existingOrder = await apiService.getOrderBySessionId(sessionId)
          setOrder(existingOrder)

          // Fetch event details
          if (existingOrder.event_id) {
            const eventData = await apiService.getEventBySlug(existingOrder.event_id)
            setEvent(eventData)
          }

          setProcessingPayment(false)
          return
        } catch (error) {
          // Order doesn't exist yet, need to create it
          console.log("Order not found, creating new order...")
        }

        // Get payment details from sessionStorage (set during checkout)
        const paymentDataStr = sessionStorage.getItem(`payment_${sessionId}`)
        if (!paymentDataStr) {
          throw new Error("Payment data not found. Please contact support.")
        }

        const paymentData = JSON.parse(paymentDataStr)

        // Complete the payment by calling your /success endpoint
        await apiService.completePayment({
          transactionId: sessionId,
          eventId: paymentData.eventId,
          userId: currentUser.userId,
          totalAmount: paymentData.totalAmount,
          tickets: paymentData.tickets,
          totalQuantity: paymentData.totalQuantity,
        })

        // Clean up sessionStorage
        sessionStorage.removeItem(`payment_${sessionId}`)

        // Fetch the created order
        const newOrder = await apiService.getOrderBySessionId(sessionId)
        setOrder(newOrder)

        // Fetch event details
        if (newOrder.event_id) {
          const eventData = await apiService.getEventBySlug(newOrder.event_id)
          setEvent(eventData)
        }

        toast.success("Payment completed successfully!")
        setProcessingPayment(false)
      } catch (error: any) {
        console.error("Payment processing error:", error)
        toast.error(error.message || "Failed to process payment")
        setProcessingPayment(false)
      } finally {
        setLoading(false)
      }
    }

    processPayment()
  }, [sessionId, currentUser])

  if (loading || processingPayment) {
    return (
      <div className="container py-8 md:py-12">
        <div className="max-w-2xl mx-auto text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">{processingPayment ? "Processing your payment..." : "Loading..."}</h1>
          <p className="text-muted-foreground">
            {processingPayment
              ? "Please wait while we confirm your payment and generate your tickets."
              : "Fetching your order details..."}
          </p>
        </div>
      </div>
    )
  }

  if (!sessionId || !order) {
    return (
      <div className="container py-8 md:py-12">
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-destructive mb-4">
            <CheckCircle className="h-12 w-12 mx-auto mb-4" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Order Not Found</h1>
          <p className="text-muted-foreground mb-6">
            We couldn't find your order. Please check your email for confirmation or contact support.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild>
              <Link to="/events">Browse Events</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/profile">My Tickets</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8 md:py-12">
      <div className="max-w-2xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="text-green-500 mb-4">
            <CheckCircle className="h-16 w-16 mx-auto" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Payment Successful! 🎉</h1>
          <p className="text-muted-foreground">Your tickets have been confirmed and sent to your email.</p>
        </div>

        {/* Order Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Order Confirmation
              <Badge variant="secondary">#{order.id.slice(-8)}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {event && (
              <>
                <div>
                  <h3 className="font-semibold text-lg">{event.title}</h3>
                  <p className="text-muted-foreground">
                    {format(new Date(event.start_time), "EEEE, MMMM d, yyyy 'at' h:mm a")}
                  </p>
                  <p className="text-muted-foreground">
                    {event.location_name} • {event.city_name}, {event.voivodeship_name}
                  </p>
                </div>
                <Separator />
              </>
            )}

            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Tickets</span>
                <span>{order.ticket_quantity} ticket(s)</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Total Paid</span>
                <span>${(order.total_amount_cents / 100).toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tickets */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Your Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.tickets?.map((ticket, index) => (
                <div key={ticket.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">Ticket #{index + 1}</h4>
                      <p className="text-sm text-muted-foreground">ID: {ticket.id}</p>
                    </div>
                    <div className="text-right">
                      <QrCode className="h-8 w-8 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground mt-1">QR Code</p>
                    </div>
                  </div>
                </div>
              )) || <p className="text-muted-foreground">Tickets are being generated...</p>}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <Button asChild className="w-full">
            <Link to="/profile">
              <QrCode className="mr-2 h-4 w-4" />
              View My Tickets
            </Link>
          </Button>
          <Button variant="outline" className="w-full">
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
          <Button variant="outline" className="w-full">
            <Calendar className="mr-2 h-4 w-4" />
            Add to Calendar
          </Button>
          <Button variant="outline" className="w-full">
            <Share2 className="mr-2 h-4 w-4" />
            Share Event
          </Button>
        </div>

        {/* Important Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Important Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium text-left">Email Confirmation</p>
                <p className="text-sm text-muted-foreground">
                  A confirmation email with your tickets has been sent to {currentUser?.email}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <QrCode className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium text-left">Entry Requirements</p>
                <p className="text-sm text-muted-foreground">
                  Present your QR code at the venue entrance. Screenshots are acceptable.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-center">
          <Button variant="ghost" asChild>
            <Link to="/events">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Events
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
