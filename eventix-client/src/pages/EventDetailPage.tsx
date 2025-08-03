import { useState, useEffect, useMemo } from "react"
import { useParams } from "react-router"
import { CalendarIcon, MapPinIcon, Clock, Share2, Heart, Info, Loader2, Lock, Ticket } from "lucide-react"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import EventCard from "../components/EventCard"
import Breadcrumb from "../components/Breadcrumb"
import { apiService, type EventDetail, type EventResponse } from "../services/api"
import { toast } from "sonner"
import { format } from "date-fns"
import { useAuth } from "../contexts/AuthContext"
import MapComponent from "../components/MapComponent"; // Import your new MapComponent

export default function EventDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [event, setEvent] = useState<EventDetail | null>(null)
  const [similarEvents, setSimilarEvents] = useState<EventResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTicketId, setSelectedTicketId] = useState<string>("")
  const [quantity, setQuantity] = useState("1")
  const [checkingOut, setCheckingOut] = useState(false)
  const { isLoggedIn, currentUser } = useAuth()

  // ... (rest of your existing code)

  // Fetch event details
  useEffect(() => {
    const fetchEvent = async () => {
      console.log("Current slug in EventDetailPage:", slug);
      if (!slug) {
        console.warn("EventDetailPage: Slug is undefined. Cannot fetch event.");
        setLoading(false);
        setEvent(null);
        return;
      }

      setLoading(true);
      setEvent(null);
      try {
        const eventData = await apiService.getEventBySlug(slug);
        console.log("Fetched event data in EventDetailPage:", eventData);
        setEvent(eventData);
        // Automatically select the first ticket type if available
        if (eventData?.ticket_types && eventData.ticket_types.length > 0) {
            setSelectedTicketId(eventData.ticket_types[0].id.toString());
        }


        if (eventData && eventData.city_id) {
          const similarData = await apiService.getEvents({
            city_id: eventData.city_id,
            page_size: 3,
          });
          setSimilarEvents(similarData.events.filter((e) => Number(e.id) !== eventData.id));
        } else {
          console.warn("EventDetailPage: Cannot fetch similar events, eventData or eventData.city_id is missing.");
          setSimilarEvents([]);
        }
      } catch (error: any) {
        console.error("Failed to fetch event in EventDetailPage:", error);
        toast.error(error.message || "Failed to load event details.");
        setEvent(null);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [slug]);

  const selectedTicket = useMemo(() => {
    if (!event || !selectedTicketId) return null;
    return event.ticket_types?.find(
      (ticket) => ticket.id.toString() === selectedTicketId
    );
  }, [event, selectedTicketId]);

  const totalPrice = useMemo(() => {
    if (!selectedTicket) return 0;
    return selectedTicket.price_cents * Number.parseInt(quantity);
  }, [selectedTicket, quantity]);

  const formatPrice = (price_cents: number) => {
    return (price_cents / 100).toFixed(2) + " PLN";
  };

const handleShare = () => {
    const shareUrl = window.location.href;

    if (navigator.share) {
      navigator
        .share({
          title: event?.title || "Event",
          text: "Check out this event!",
          url: shareUrl,
        })
        .catch((error) => console.error("Error sharing", error));
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => {
        toast.success("Link copied to clipboard!");
      });
    }
  };

  const handleCheckout = async () => {
    if (!isLoggedIn) {
      toast.info("Please log in to proceed with the checkout.");
      return;
    }

    if (!event || !selectedTicket) return;

    const quantityNum = Number.parseInt(quantity);
    if (!selectedTicketId || quantityNum <= 0) {
      toast.error("Please select a ticket type and a valid quantity.");
      return;
    }


    const selectedTicketsForCheckout = [
        { ticket_type_id: Number(selectedTicketId), quantity: quantityNum },
    ];

    setCheckingOut(true);
    try {
        const res = await fetch("http://localhost:8080/checkout/create-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                user_id: currentUser?.userId,
                event_id: event.id,
                tickets: selectedTicketsForCheckout,
            }),
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(
                data.error || `Checkout failed with status: ${res.status}`
            );
        }

        if (data.url) {
            // Store the transaction ID and other relevant details in localStorage before redirecting
            // NOTE: Your current code is using localStorage. The CheckoutSuccessPage expects sessionStorage.
            // It's generally better for transient data like this to use sessionStorage.
            // I'm changing it to sessionStorage here to match the success page's expectation.

            const paymentDataToStore = {
                eventId: event.id,
                userId: currentUser?.userId, // Ensure currentUser is available
                totalAmount: totalPrice.toString(), // Use the calculated totalPrice
                tickets: selectedTicketsForCheckout,
                totalQuantity: quantityNum, // The total quantity of tickets
            };

            // Store in sessionStorage with a key that includes the session ID
            sessionStorage.setItem(`payment_${data.transaction_id}`, JSON.stringify(paymentDataToStore));

            // Clean up any old localStorage items if you're transitioning to sessionStorage
            localStorage.removeItem("pending_transaction_id");
            localStorage.removeItem("pending_event_title");
            localStorage.removeItem("pending_total_amount");
            localStorage.removeItem("pending_checkout_time");
            localStorage.removeItem("pending_tickets_selected");

            console.log("Transaction ID:", data.transaction_id);
            console.log("Selected Ticket Details:", selectedTicketsForCheckout);

            // Redirect to Stripe checkout
            window.location.href = data.url;
        } else {
            throw new Error(
                "Checkout session created, but no redirect URL received."
            );
        }
    } catch (e) {
        console.error("Checkout error:", e);
        toast.error(
            `Checkout failed: ${(e as Error).message || "An unexpected error occurred."}`
        );
    } finally {
        setCheckingOut(false);
    }
};


  if (loading) {
    return (
      <div className="container py-8 md:py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded mb-6 w-1/3" />
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="aspect-video bg-muted rounded-lg mb-6" />
              <div className="h-8 bg-muted rounded mb-4" />
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded" />
                <div className="h-4 bg-muted rounded w-3/4" />
              </div>
            </div>
            <div className="h-96 bg-muted rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="container py-8 md:py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Event not found</h1>
          <p className="text-muted-foreground mt-2">The event you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  // Build breadcrumb items
  const breadcrumbItems = [
    { label: "Events", href: "/events" },
    { label: event.category_ids?.[0] || "Event", href: `/events?category=${event.category_ids?.[0]}` },
    { label: event.title },
  ]

  // Convert API event to EventCard props
  const convertEventForCard = (apiEvent: EventResponse) => ({
    id: apiEvent.id,
    title: apiEvent.title,
    date: format(new Date(apiEvent.start_time), "MMM d, yyyy"),
    time: format(new Date(apiEvent.start_time), "h:mm a"),
    location: `${apiEvent.location_name}, ${apiEvent.city_name}`,
    imageUrl: apiEvent.image_url || "/placeholder.svg?height=200&width=400",
    price: "From $0.00",
    category: "Event",
    slug: apiEvent.slug,
  })

  return (
    <div className="container py-8 md:py-12">
      {/* Breadcrumb */}
      <Breadcrumb items={breadcrumbItems} className="mb-6" />

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-lg">
            <img
              src={event.image_url || "/placeholder.svg?height=400&width=800"}
              alt={event.title}
              className="w-full object-cover aspect-video"
            />
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between">
              <Badge variant="outline">{event.category_ids?.[0] || "Event"}</Badge>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon">
                  <Heart className="h-5 w-5" />
                </Button>
                <Button onClick={handleShare} variant="ghost" size="icon">
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">{event.title}</h1>

            <div className="mt-4 flex flex-col gap-2">
              <div className="flex items-center text-muted-foreground">
                <CalendarIcon className="mr-2 h-5 w-5" />
                <span>{format(new Date(event.start_time), "EEEE, MMMM d, yyyy")}</span>
              </div>
              <div className="flex items-center text-muted-foreground">
                <Clock className="mr-2 h-5 w-5" />
                <span>{format(new Date(event.start_time), "h:mm a")}</span>
              </div>
              <div className="flex items-center text-muted-foreground">
                <MapPinIcon className="mr-2 h-5 w-5" />
                <span>
                  {event.location_name} • {event.city_name}, {event.voivodeship_name}
                </span>
              </div>
            </div>

            <Tabs defaultValue="about" className="mt-8">
              <TabsList>
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="location">Location</TabsTrigger>
              </TabsList>
              <TabsContent value="about" className="mt-4">
                <div className="prose max-w-none dark:prose-invert">
                  <p>{event.description || "No description available."}</p>
                </div>
              </TabsContent>
              <TabsContent value="location" className="mt-4">
                <div className="rounded-lg border bg-muted/50 p-4">
                  <h3 className="text-lg font-semibold">{event.location_name}</h3>
                  <p className="text-muted-foreground">
                    {event.city_name}, {event.voivodeship_name}
                  </p>
                  {/* Render MapComponent if latitude and longitude are available */}
                  {event.latitude && event.longitude ? (
                    <div className="mt-4 aspect-video overflow-hidden rounded-md bg-muted">
                      <MapComponent
                        latitude={event.latitude}
                        longitude={event.longitude}
                        locationName={event.location_name}
                      />
                    </div>
                  ) : (
                    <div className="mt-4 aspect-video overflow-hidden rounded-md bg-muted">
                      <div className="flex h-full items-center justify-center">
                        <p className="text-muted-foreground">Location coordinates not available for map display.</p>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Ticket Selection */}
        <div>
          <div className="sticky top-20 rounded-lg border p-6">
            <h2 className="text-xl font-semibold">Get Tickets</h2>
            <p className="mt-1 text-sm text-muted-foreground">Select ticket type and quantity</p>

            <div className="mt-6 space-y-4">
              {event.ticket_types && event.ticket_types.length > 0 ? (
                <>
                  <div>
                    <label className="text-sm font-medium">Ticket Type</label>
                    <Select value={selectedTicketId} onValueChange={setSelectedTicketId}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select ticket type" />
                      </SelectTrigger>
                      <SelectContent>
                        {event.ticket_types.map((ticket) => (
                          <SelectItem key={ticket.id} value={ticket.id.toString()} disabled={ticket.available_quantity === 0}>
                            <div className="flex flex-col">
                              <div className="font-medium">
                                {ticket.name} - {formatPrice(ticket.price_cents)}
                                {ticket.available_quantity === 0 && " (Sold Out)"}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Quantity</label>
                    <Select value={quantity} onValueChange={setQuantity} disabled={!selectedTicket || selectedTicket.available_quantity === 0}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select quantity" />
                      </SelectTrigger>
                      <SelectContent>
                        {[...Array(selectedTicket?.available_quantity || 0)].map((_, i) => (
                          <SelectItem key={i + 1} value={(i + 1).toString()}>
                            {i + 1}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedTicket && (
                    <div className="rounded-lg bg-muted/50 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {selectedTicket.name}
                          </span>
                          {selectedTicket.description && (
                            <span className="text-xs text-muted-foreground">
                              {selectedTicket.description}
                            </span>
                          )}
                        </div>
                        <span>
                          {formatPrice(selectedTicket.price_cents)}
                        </span>
                      </div>
                      <div className="mt-4 flex items-center justify-between border-t pt-4">
                        <span className="font-medium">Total</span>
                        <span className="font-bold">
                          {formatPrice(totalPrice)}
                        </span>
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleCheckout}
                    disabled={!selectedTicketId || Number.parseInt(quantity) === 0 || checkingOut || !isLoggedIn || (selectedTicket?.available_quantity === 0)}
                    className="w-full"
                    size="lg"
                  >
                    {checkingOut && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {!isLoggedIn && <Lock className="mr-2 h-4 w-4" />}

                    {checkingOut ? "Processing..." : isLoggedIn ? "Proceed to Checkout" : "Log in to Checkout"}
                    {isLoggedIn && !checkingOut && <Ticket className="ml-2 h-5 w-5" />}
                  </Button>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No tickets available for this event.</p>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Info className="h-4 w-4" />
                <span>Tickets are non-refundable but can be transferred.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Similar Events */}
      {similarEvents.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold tracking-tight">Similar Events</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {similarEvents.map((event) => (
              <EventCard key={event.id} {...convertEventForCard(event)} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}