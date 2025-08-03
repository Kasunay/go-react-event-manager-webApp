export interface Ticket {
  id: string
  eventId: string
  eventName: string
  eventDate: string
  eventTime: string
  venue: string
  venueAddress: string
  seatSection?: string
  seatRow?: string
  seatNumber?: string
  ticketType: string
  price: number
  purchaseDate: string
  qrCode: string
  status: "active" | "used" | "expired"
  category: string
}
