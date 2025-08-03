"use client"

import { useState, useEffect } from "react"
import { useParams, Link } from "react-router"
import { ChevronRight, ArrowLeft } from "lucide-react"
import { Button } from "../components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Skeleton } from "../components/ui/skeleton"
import EventCard from "../components/EventCard"
import Breadcrumb from "../components/Breadcrumb"
import { apiService, type Category, type EventResponse, type EventFilters } from "../services/api"
import { toast } from "sonner"

export default function CategoryDetailPage() {
  const { categoryId, subcategoryId } = useParams<{ categoryId: string; subcategoryId?: string }>()

  const [categories, setCategories] = useState<Category[]>([])
  const [events, setEvents] = useState<EventResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [eventsLoading, setEventsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalEvents, setTotalEvents] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)

  // Find the category and subcategory
  const category = categories.find((c) => c.slug === categoryId)
  const subcategory = subcategoryId ? category?.subCategories?.find((s) => s.slug === subcategoryId) : null

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true)
        const data = await apiService.getCategories()
        setCategories(data)
      } catch (err) {
        console.error("Failed to fetch categories:", err)
        setError("Failed to load categories")
        toast.error("Failed to load categories")
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  // Fetch events when category/subcategory changes
  useEffect(() => {
    if (!category) return

    const fetchEvents = async () => {
      try {
        setEventsLoading(true)

        const filters: EventFilters = {
          page: currentPage,
          page_size: 12,
        }

        if (subcategoryId) {
          // If we have a subcategory, filter by it
          filters.category_slug = subcategoryId
          filters.parent_category_slug = categoryId
        } else {
          // If we only have a parent category, filter by it
          filters.parent_category_slug = categoryId
        }

        const data = await apiService.getEvents(filters)
        setEvents(data.events)
        setTotalEvents(data.total)
      } catch (err) {
        console.error("Failed to fetch events:", err)
        toast.error("Failed to load events")
        setEvents([])
      } finally {
        setEventsLoading(false)
      }
    }

    fetchEvents()
  }, [category, subcategoryId, categoryId, currentPage])

  // Reset page when category/subcategory changes
  useEffect(() => {
    setCurrentPage(1)
  }, [categoryId, subcategoryId])

  if (loading) {
    return (
      <div className="container py-8 md:py-12">
        <Skeleton className="h-6 w-64 mb-6" />
        <div className="mb-8">
          <Skeleton className="h-10 w-80 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-48 w-full rounded-lg" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error || !category) {
    return (
      <div className="container py-12 text-center">
        <h1 className="text-2xl font-bold">Category not found</h1>
        <p className="mt-4 text-muted-foreground">The category you're looking for doesn't exist.</p>
        <Button asChild className="mt-6">
          <Link to="/categories">View All Categories</Link>
        </Button>
      </div>
    )
  }

  // Build breadcrumb items
  const breadcrumbItems = [
    { label: "Categories", href: "/categories" },
    { label: category.name, href: subcategoryId ? `/categories/${category.slug}` : undefined },
  ]

  if (subcategoryId && subcategory) {
    breadcrumbItems.push({ label: subcategory.name, href: undefined })
  }

  return (
    <div className="container py-8 md:py-12">
      {/* Breadcrumb */}
      <Breadcrumb items={breadcrumbItems} className="mb-6" />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          {subcategoryId && (
            <Button variant="ghost" size="sm" asChild>
              <Link to={`/categories/${categoryId}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to {category.name}
              </Link>
            </Button>
          )}
        </div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          {subcategoryId ? subcategory?.name : category.name} Events
        </h1>
        <p className="mt-2 text-muted-foreground">
          {subcategoryId && subcategory
            ? `Browse ${subcategory.name.toLowerCase()} events`
            : `Browse ${category.name.toLowerCase()} events and find your next experience`}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {totalEvents} {totalEvents === 1 ? "event" : "events"} found
        </p>
      </div>

      {/* Subcategories Tabs - only show if we're on the main category page */}
      {!subcategoryId && category.subCategories && category.subCategories.length > 0 && (
        <Tabs defaultValue="all" className="mb-8">
          <TabsList className="flex flex-wrap">
            <TabsTrigger value="all">All</TabsTrigger>
            {category.subCategories.map((sub) => (
              <TabsTrigger key={sub.id} value={sub.slug} asChild>
                <Link to={`/categories/${category.slug}/${sub.slug}`}>{sub.name}</Link>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      {/* Events Grid */}
      {eventsLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-48 w-full rounded-lg" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {events.map((event) => (
            <EventCard
              key={event.id}
              id={event.id}
              title={event.title}
              date={new Date(event.start_time).toLocaleDateString()}
              time={new Date(event.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              location={`${event.location_name}, ${event.city_name}`}
              imageUrl={event.image_url || "/placeholder.svg?height=200&width=400"} // You might want to fetch actual pricing from ticket types
              // Removed subcategory prop as it's not defined in EventCardProps
              slug={event.slug}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!eventsLoading && events.length === 0 && (
        <div className="mt-12 flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-3">
            <ChevronRight className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No events found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            There are no {subcategoryId && subcategory ? subcategory.name.toLowerCase() : category.name.toLowerCase()}{" "}
            events available at the moment.
          </p>
          <Button variant="outline" className="mt-4" asChild>
            <Link to="/events">Browse All Events</Link>
          </Button>
        </div>
      )}

      {/* Pagination */}
      {!eventsLoading && events.length > 0 && totalEvents > 12 && (
        <div className="mt-12 flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-4 text-sm text-muted-foreground">
            Page {currentPage} of {Math.ceil(totalEvents / 12)}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage((prev) => prev + 1)}
            disabled={currentPage >= Math.ceil(totalEvents / 12)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
