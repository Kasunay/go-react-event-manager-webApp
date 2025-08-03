import { useState, useEffect } from "react"
import { Link } from "react-router"
import {
  ArrowRight,
  Sparkles,

} from "lucide-react"
import { Card, CardContent } from "../components/ui/card"
import { Button } from "../components/ui/button"

import { Skeleton } from "../components/ui/skeleton"
import Breadcrumb from "../components/Breadcrumb"
import CategoryCard from "../components/CategoryCard"
import { apiService, type Category } from "../services/api"
import { toast } from "sonner"

// Map of category slugs to icons (you can expand this based on your actual category slugs)


export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  // For now, we'll treat all parent categories as featured since we don't have a featured flag from API
  const featuredCategories = categories.filter(
    (category) => !category.subCategories || category.subCategories.length > 0,
  )
  // Removed unused variable declaration

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <div className="container py-8 md:py-12">
          <Breadcrumb items={[{ label: "Categories" }]} className="mb-6" />

          {/* Hero Section Skeleton */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary/10 via-primary/5 to-background p-8 md:p-12 mb-16">
            <div className="space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-16 w-96" />
              <Skeleton className="h-6 w-80" />
              <Skeleton className="h-12 w-40" />
            </div>
          </div>

          {/* Categories Skeleton */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="h-48">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-12 rounded-2xl" />
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-full" />
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-6 w-12" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <div className="container py-8 md:py-12">
          <Breadcrumb items={[{ label: "Categories" }]} className="mb-6" />
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-destructive/10 p-3 mb-4">
              <Sparkles className="h-6 w-6 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Failed to load categories</h3>
            <p className="text-sm text-muted-foreground mb-4">
              There was an error loading the categories. Please try again.
            </p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container py-8 md:py-12">
        {/* Breadcrumb */}
        <Breadcrumb items={[{ label: "Categories" }]} className="mb-6" />

        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary/10 via-primary/5 to-background p-8 md:p-12">
          <div className="relative z-10 text-center">
            <div className="mb-4 flex items-center justify-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium text-primary">Discover Events</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
              Find Your Next
              <span className="block bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Experience
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
              Browse through our carefully curated categories to discover events that match your interests and passions.
            </p>
            <Button size="lg" className="mt-8" asChild>
              <Link to="/events">
                Explore All Events
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>

          {/* Decorative elements */}
          <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-primary/5 blur-3xl" />
        </div>

        {/* Featured Categories */}
        {featuredCategories.length > 0 && (
          <section className="mt-16">
            <div className="mb-8">
              <h2 className="text-3xl font-bold tracking-tight">Popular Categories</h2>
              <p className="mt-2 text-muted-foreground">Most loved event categories by our community</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featuredCategories.slice(0, 6).map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="mt-16">
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold">Can't find what you're looking for?</h2>
              <p className="mt-2 text-muted-foreground">
                Browse all events or use our advanced search to find exactly what you need.
              </p>
              <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Button size="lg" asChild>
                  <Link to="/events">Browse All Events</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/events">Advanced Search</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}
