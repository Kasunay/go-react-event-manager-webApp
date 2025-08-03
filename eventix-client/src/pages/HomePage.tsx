import { Link } from "react-router"
import { Button } from "../components/ui/button"
import EventCard from "../components/EventCard"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import CategoryCard from "../components/CategoryCard"
import { categories } from "../data/categories"
import { useEffect, useState } from "react"
import { apiService, type EventResponse } from "../services/api"

export default function HomePage() {
  const [featuredEvents, setFeaturedEvents] = useState<EventResponse[]>([])

  useEffect(() => {
    const fetchFeaturedEvents = async () => {
      try {
        // Fetch first 4 events to be featured
        const response = await apiService.getEvents({ page_size: 4 })
        setFeaturedEvents(response.events)
      } catch (error) {
        console.error("Failed to fetch featured events:", error)
        // Optionally, set some error state to show in the UI
      }
    }

    fetchFeaturedEvents()
  }, [])

  // Get featured categories
  const popularCategories = categories.filter((category) => category.featured).slice(0, 6)
  // Get all categories for the horizontal scroll

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative">
        <div className="bg-gradient-to-r from-primary/20 to-primary/5 py-20 md:py-32">
          <div className="container flex flex-col items-center text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Discover and Book Amazing Events
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
              Find the best concerts, shows, conferences, and more. Get your tickets now and create unforgettable
              memories.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link to="/events">
                <Button size="lg">Browse Events</Button>
              </Link>
              <Button variant="outline" size="lg">
                How It Works
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Events */}
      <section className="container py-12 md:py-16">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div>
            <h2 className="text-3xl text-left font-bold tracking-tight">Featured Events</h2>
            <p className="text-muted-foreground">Discover our handpicked selection of must-attend events</p>
          </div>
          <Link to="/events">
            <Button variant="outline">View All Events</Button>
          </Link>
        </div>

        <Tabs defaultValue="all" className="mt-8">
          <TabsList className="mb-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="music">Music</TabsTrigger>
            <TabsTrigger value="sports">Sports</TabsTrigger>
            <TabsTrigger value="arts">Arts</TabsTrigger>
            <TabsTrigger value="conferences">Conferences</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-0">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featuredEvents.map((event) => {
                const eventDate = new Date(event.start_time)
                return (
                  <EventCard
                    key={event.id}
                    id={event.id}
                    slug={event.slug}
                    title={event.title}
                    date={eventDate.toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                    time={eventDate.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                    location={`${event.location_name}, ${event.city_name}`}
                    imageUrl={event.image_url || "/placeholder.svg?height=200&width=400"}
                    
                    
                  />
                )
              })}
            </div>
          </TabsContent>
          <TabsContent value="music" className="mt-0">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featuredEvents
                .filter((event) => event.category_ids.includes(1)) // Assuming 'Music' category has id 1
                .map((event) => {
                  const eventDate = new Date(event.start_time)
                  return (
                    <EventCard
                      key={event.id}
                      id={event.id}
                      slug={event.slug}
                      title={event.title}
                      date={eventDate.toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                      time={eventDate.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                      location={`${event.location_name}, ${event.city_name}`}
                      imageUrl={event.image_url || "/placeholder.svg?height=200&width=400"}
                    />
                  )
                })}
            </div>
          </TabsContent>
          {/* Other tabs content would be similar */}
        </Tabs>
      </section>

         {/* Popular Categories */}
      <section className="container py-12 md:py-16">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div>
            <h2 className="text-3xl text-left font-bold tracking-tight">Popular Categories</h2>
            <p className="text-muted-foreground">Discover events by category and find your next experience</p>
          </div>
          <Link to="/categories">
            <Button variant="outline">View All Categories</Button>
          </Link>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {popularCategories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-muted/50 py-12 md:py-16">
        <div className="container">
          <h2 className="text-center text-3xl font-bold tracking-tight">How It Works</h2>
          <div className="mt-8 grid gap-8 md:grid-cols-3">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                1
              </div>
              <h3 className="mt-4 text-xl font-semibold">Browse Events</h3>
              <p className="mt-2 text-muted-foreground">
                Explore our wide selection of events across various categories.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                2
              </div>
              <h3 className="mt-4 text-xl font-semibold">Select Tickets</h3>
              <p className="mt-2 text-muted-foreground">Choose your preferred seats and ticket types.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                3
              </div>
              <h3 className="mt-4 text-xl font-semibold">Secure Checkout</h3>
              <p className="mt-2 text-muted-foreground">
                Complete your purchase securely and receive your e-tickets instantly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="container py-12 md:py-16">
        <div className="rounded-lg bg-muted p-8">
          <div className="flex flex-col items-center text-center">
            <h2 className="text-2xl font-bold">Stay Updated</h2>
            <p className="mt-2 max-w-md text-muted-foreground">
              Subscribe to our newsletter to get the latest updates on new events and exclusive offers.
            </p>
            <div className="mt-6 flex w-full max-w-md flex-col gap-2 sm:flex-row">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <Button>Subscribe</Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
