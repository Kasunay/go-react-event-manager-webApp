export interface Event {
  id: string
  creator_id?: string
  title: string
  slug: string
  description: string
  start_time: string
  location_name?: string | null
  location_address?: string | null
  image_url?: string | null
  is_published: boolean
  created_at?: string
  updated_at?: string
}

export interface CreateEventRequest {
  title: string
  slug: string
  description: string
  start_time: string
  location_name?: string
  location_address?: string
  image_url?: string // Base64 encoded image
  is_published: boolean
  city_id: number
  category_ids: number[]
  ticket_types: TicketTypeRequest[]
}

export interface UpdateEventRequest {
  title?: string
  slug?: string
  description?: string
  start_time?: string
  location_name?: string | null
  location_address?: string | null
  image_url?: string // Base64 encoded image
  is_published?: boolean
}

export interface TicketTypeRequest {
  name: string
  description: string
  price_cents: number
  total_quantity: number
}

export interface TicketType {
  id: string
  name: string
  description: string
  price_cents: number
  total_quantity: number
  available_quantity: number
  created_at: string
  updated_at: string
}

export interface Ticket {
  id: string
  order_id: string
  ticket_type_id: string
  code: string
  status: boolean // true if used, false if not
  created_at: string
  user_email: string
  ticket_type_name: string
}

export interface Order {
  id: string
  user_id: string
  buyer_email: string
  status: string
  total_amount: number // in cents
  payment_ref: string
  created_at: string
}
