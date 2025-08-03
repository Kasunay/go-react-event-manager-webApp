const API_BASE_URL = "http://localhost:8080"

export interface City {
  id: number
  name: string
}

export interface VoivodeshipWithCities {
  id: number
  name: string
  cities: City[]
}

export interface Category {
  id: number
  name: string
  slug: string
  subCategories?: Category[]
}

// Event interfaces matching your backend
export interface TicketType {
  id: number
  name: string
  price_cents: number
  total_quantity: number
  available_quantity: number
}

// Example: src/services/api.ts (or your types file)
export type EventDetail = {
  id: number;
  title: string;
  description: string;
  start_time: string;
  image_url: string | null;
  location_name: string;
  city_name: string;
  voivodeship_name: string;
  category_ids?: string[];
  slug: string;
  latitude?: number;  // Add this
  longitude?: number; // Add this
  ticket_types?: {
    id: number;
    name: string;
    description: string;
    price_cents: number;
    available_quantity: number;
  }[];
  city_id?: number;
};

export interface EventResponse {
  id: string
  title: string
  slug: string
  description: string
  start_time: string
  location_name: string
  location_address: string
  image_url: string
  city_id: number
  city_name: string
  voivodeship_id: number
  voivodeship_name: string
  category_ids: number[]
}

export interface PaginatedEventsResponse {
  events: EventResponse[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface EventFilters {
  city_id?: number
  voivodeship_id?: number
  start_date?: string
  end_date?: string
  category_slug?: string
  parent_category_slug?: string
  search?: string
  page?: number
  page_size?: number
}

// Payment and Order interfaces
export interface PurchasedTicket {
  ticket_type_id: number
  quantity: number
}

export interface PaymentRecord {
  transactionId: string
  eventId: string
  userId: string
  totalAmount: string
  tickets: PurchasedTicket[]
  totalQuantity: number
}

export interface OrderResponse {
  id: string
  user_id: string
  total_amount_cents: number
  status: string
  event_id: string
  ticket_quantity: number
  created_at: string
  tickets: Array<{
    id: string
    ticket_type_id: number
    ticket_code: string
  }>
}

// Order and Ticket interfaces for admin/creator views
export interface OrderInfo {
  id: string
  user_id: string
  buyer_email: string
  status: string
  totalAmount: number // in cents
  paymentRef: string
  createdAt: string
}

export interface AdminTicketInfo {
  id: string
  order_id: string
  ticket_type_id: number
  code: string
  is_used: boolean // true if used, false if not
  created_at: string
  user_email: string
  ticket_type_name: string
}

export const apiService = {
  // Fetch voivodeships with their cities
  async getVoivodeshipsWithCities(): Promise<VoivodeshipWithCities[]> {
    const response = await fetch(`${API_BASE_URL}/api/cities`, {
      credentials: "include",
    })

    if (!response.ok) {
      throw new Error("Failed to fetch cities")
    }

    return response.json()
  },

  // Fetch categories with subcategories
  async getCategories(): Promise<Category[]> {
    const response = await fetch(`${API_BASE_URL}/api/categories`, {
      credentials: "include",
    })

    if (!response.ok) {
      throw new Error("Failed to fetch categories")
    }

    return response.json()
  },

  // Fetch events with filters and pagination
  async getEvents(filters: EventFilters = {}): Promise<PaginatedEventsResponse> {
    const params = new URLSearchParams()

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, value.toString())
      }
    })

    const response = await fetch(`${API_BASE_URL}/api/events?${params.toString()}`, {
      credentials: "include",
    })

    if (!response.ok) {
      throw new Error("Failed to fetch events")
    }

    return response.json()
  },

  // Fetch single event by slug
  async getEventBySlug(slug: string): Promise<EventDetail> {
    const response = await fetch(`${API_BASE_URL}/api/events/${slug}`, {
      credentials: "include",
    })

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Event not found")
      }
      throw new Error("Failed to fetch event")
    }

    return response.json()
  },

  // Get all categories as a flat list for easier lookup
  async getAllCategoriesFlat(): Promise<Category[]> {
    const nestedCategories = await this.getCategories()
    const flatCategories: Category[] = []

    nestedCategories.forEach((parent) => {
      flatCategories.push(parent)
      if (parent.subCategories) {
        flatCategories.push(...parent.subCategories)
      }
    })

    return flatCategories
  },

  // Complete payment and create order
  async completePayment(paymentData: PaymentRecord): Promise<{ status: string }> {
    const response = await fetch(`${API_BASE_URL}/api/success`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(paymentData),
    })

    if (!response.ok) {
      throw new Error("Failed to complete payment")
    }

    return response.json()
  },

  // Get order details by session ID (you'll need to create this endpoint)
  async getOrderBySessionId(sessionId: string): Promise<OrderResponse> {
    const response = await fetch(`${API_BASE_URL}/api/orders/session/${sessionId}`, {
      credentials: "include",
    })

    if (!response.ok) {
      throw new Error("Failed to fetch order details")
    }

    return response.json()
  },

  // Get orders for a specific event (admin/creator only)
  async getEventOrders(eventId: string): Promise<OrderInfo[]> {
    const response = await fetch(`${API_BASE_URL}/api/admin/events/${eventId}/orders`, {
      credentials: "include",
    })

    if (!response.ok) {
      throw new Error("Failed to fetch event orders")
    }

    return response.json()
  },

  // Get tickets for a specific event (admin/creator only)
  async getEventTickets(eventId: string): Promise<AdminTicketInfo[]> {
    const response = await fetch(`${API_BASE_URL}/api/admin/event/${eventId}/tickets`, {
      credentials: "include",
    })

    if (!response.ok) {
      throw new Error("Failed to fetch event tickets")
    }

    return response.json()
  },
}
