import { Calendar, Clock, MapPin, User, CreditCard } from "lucide-react"
import { Card, CardContent, CardHeader } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { QRCode } from "./QRCode"
import type { Ticket } from "../types/ticket"
import { cn } from "../lib/utils"

interface TicketCardProps {
  ticket: Ticket
}

export function TicketCard({ ticket }: TicketCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "used":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "expired":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <Card className={cn("overflow-hidden transition-all hover:shadow-lg", ticket.status === "expired" && "opacity-75")}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold leading-none">{ticket.eventName}</h3>
            <p className="text-sm text-muted-foreground">Ticket ID: {ticket.id}</p>
          </div>
          <Badge className={getStatusColor(ticket.status)}>
            {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Event Details */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{formatDate(ticket.eventDate)}</span>
            </div>

            <div className="flex items-center space-x-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{ticket.eventTime}</span>
            </div>

            <div className="flex items-start space-x-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <div>{ticket.venue}</div>
                <div className="text-muted-foreground">{ticket.venueAddress}</div>
              </div>
            </div>

            {ticket.seatSection && (
              <div className="flex items-center space-x-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>
                  Section {ticket.seatSection}
                  {ticket.seatRow && `, Row ${ticket.seatRow}`}
                  {ticket.seatNumber && `, Seat ${ticket.seatNumber}`}
                </span>
              </div>
            )}

            <div className="flex items-center space-x-2 text-sm">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span>
                {ticket.ticketType} - ${ticket.price}
              </span>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center space-y-3">
            <QRCode value={ticket.qrCode} size={120} />
            <p className="text-xs text-muted-foreground text-center">Show this QR code at the venue entrance</p>
            {ticket.status === "active" && (
              <Button variant="outline" size="sm" className="w-full">
                Download Ticket
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
