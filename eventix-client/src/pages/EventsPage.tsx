// EventsPage.tsx
import { useState, useEffect } from "react"
import { Search, Filter, X } from "lucide-react"
import { Input } from "../components/ui/input"
import { Button } from "../components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Badge } from "../components/ui/badge"
import { Sheet, SheetContent, SheetTrigger } from "../components/ui/sheet"
import EventCard from "../components/EventCard"
import EventFilters, { type FilterState } from "../components/EventFilters"
import { format } from "date-fns"
import Breadcrumb from "../components/Breadcrumb"
// Import Category and VoivodeshipWithCities from your apiService
import { apiService, type EventResponse, type PaginatedEventsResponse, type Category, type VoivodeshipWithCities } from "../services/api"
import { toast } from "sonner"

export default function EventsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("date") // Keep this if you plan other sorting like 'name'
  const [filters, setFilters] = useState<FilterState>({
    dateRange: { from: undefined, to: undefined },
    categories: [],
    locations: [],
  })
  const [eventsData, setEventsData] = useState<PaginatedEventsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [activeFiltersCount, setActiveFiltersCount] = useState(0)
  const [allCategories, setAllCategories] = useState<Category[]>([]) // State to store all fetched categories
  const [allVoivodeships, setAllVoivodeships] = useState<VoivodeshipWithCities[]>([]) // State to store all fetched locations

  // Fetch all categories and locations for slug/name mapping in badges
  useEffect(() => {
    const fetchDataForMapping = async () => {
      try {
        const [categoriesData, locationsData] = await Promise.all([
          apiService.getCategories(),
          apiService.getVoivodeshipsWithCities(),
        ]);
        setAllCategories(categoriesData);
        setAllVoivodeships(locationsData);
      } catch (error) {
        console.error("Error fetching categories/locations for mapping:", error);
        toast.error("Failed to load necessary filter data.");
      }
    };
    fetchDataForMapping();
  }, []); // Run once on component mount

  // Helper function to get category slug from ID
  const getCategorySlugById = (id: number, categories: Category[]): string | null => {
    for (const cat of categories) {
      if (cat.id === id) {
        return cat.slug;
      }
      if (cat.subCategories) {
        const subCat = cat.subCategories.find(sc => sc.id === id);
        if (subCat) {
          return subCat.slug;
        }
      }
    }
    return null;
  };

  // Helper function to get city name from ID
  const getCityNameById = (cityId: number, voivodeships: VoivodeshipWithCities[]): string | null => {
    for (const voivodeship of voivodeships) {
      const city = voivodeship.cities.find(c => c.id === cityId);
      if (city) {
        return city.name;
      }
    }
    return null;
  };

  // Helper function to get voivodeship name from ID
  const getVoivodeshipNameById = (voivodeshipId: number, voivodeships: VoivodeshipWithCities[]): string | null => {
    const voivodeship = voivodeships.find(v => v.id === voivodeshipId);
    return voivodeship ? voivodeship.name : null;
  };


  // Fetch events from API
  const fetchEvents = async (page = 1) => {
    setLoading(true)
    try {
      const apiFilters: Record<string, string | number> = {
        page,
        page_size: 12,
      }

      // Add search term
      if (searchTerm.trim()) {
        apiFilters.search = searchTerm.trim()
      }

      // Add date range filters
      if (filters.dateRange.from) {
        // Ensure format is compatible with backend's RFC3339Nano
        apiFilters.start_date = filters.dateRange.from.toISOString()
      }
      if (filters.dateRange.to) {
        // Ensure format is compatible with backend's RFC3339Nano
        // Adjust end_date to include the whole day if only date is selected
        const endDateAdjusted = new Date(filters.dateRange.to);
        if (endDateAdjusted.getHours() === 0 && endDateAdjusted.getMinutes() === 0 && endDateAdjusted.getSeconds() === 0) {
            endDateAdjusted.setHours(23, 59, 59, 999);
        }
        apiFilters.end_date = endDateAdjusted.toISOString()
      }

      // Add location filters (Prioritize city, then voivodeship, and only send one)
      if (filters.locations.length > 0) {
        const firstLocationFilter = filters.locations[0];
        if (firstLocationFilter.cityIds.length > 0) {
            // Send the first selected city ID
            apiFilters.city_id = firstLocationFilter.cityIds[0];
        } else if (firstLocationFilter.voivodeshipId) {
            // Send the voivodeship ID if no city is selected
            apiFilters.voivodeship_id = firstLocationFilter.voivodeshipId;
        }
      }

      // Add category filters (Prioritize subcategory, then parent category, and only send one)
      if (filters.categories.length > 0) {
        const firstCategoryFilter = filters.categories[0];
        if (firstCategoryFilter.subcategoryIds.length > 0) {
            // Send the slug of the first selected subcategory
            const subCategorySlug = getCategorySlugById(firstCategoryFilter.subcategoryIds[0], allCategories);
            if (subCategorySlug) {
                apiFilters.category_slug = subCategorySlug;
            }
        } else if (firstCategoryFilter.parentId) {
            // Send the slug of the parent category if no subcategory is selected
            const parentCategorySlug = getCategorySlugById(firstCategoryFilter.parentId, allCategories);
            if (parentCategorySlug) {
                apiFilters.parent_category_slug = parentCategorySlug;
            }
        }
      }

      const data = await apiService.getEvents(apiFilters)
      setEventsData(data)
    } catch (error) {
      console.error("Failed to fetch events:", error)
      toast.error("Failed to load events. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Fetch events when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1) // Reset to first page on filter change
      fetchEvents(1)
    }, 500) // Debounce search and filter changes

    return () => clearTimeout(timeoutId)
  }, [searchTerm, filters])

  // Fetch events when page changes (only if page > 1, as initial fetch is handled by filter useEffect)
  useEffect(() => {
    if (currentPage > 1) { // Only fetch if page changes and it's not the initial page 1 load
      fetchEvents(currentPage)
    }
  }, [currentPage])

  // Count active filters
  useEffect(() => {
    let count = 0
    if (filters.dateRange.from || filters.dateRange.to) count++

    // Categories (count as 1 if any category filter is active, as backend only takes one)
    if (filters.categories.length > 0) {
        const firstCategoryFilter = filters.categories[0];
        if (firstCategoryFilter.subcategoryIds.length > 0 || firstCategoryFilter.parentId) {
            count++;
        }
    }

    // Locations (count as 1 if any location filter is active, as backend only takes one)
    if (filters.locations.length > 0) {
        const firstLocationFilter = filters.locations[0];
        if (firstLocationFilter.cityIds.length > 0 || firstLocationFilter.voivodeshipId) {
            count++;
        }
    }

    setActiveFiltersCount(count)
  }, [filters])

  // Handle filter changes
  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters)
  }

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({
      dateRange: { from: undefined, to: undefined },
      categories: [],
      locations: [],
    })
    setSearchTerm("")
    setCurrentPage(1); // Reset page on clear all filters
  }

  // Convert API event to EventCard props
  const convertEventForCard = (event: EventResponse) => ({
    id: event.id,
    title: event.title,
    // Corrected date format specifiers for consistency and clarity
    date: format(new Date(event.start_time), "MMM d, yyyy"),
    time: format(new Date(event.start_time), "h:mm a"),
    location: `${event.location_name}, ${event.city_name}`,
    imageUrl: event.image_url || "/placeholder.svg?height=200&width=400", // You'll need to fetch ticket prices separately or include in API // Map category_ids to category names - this will require a lookup too if you want actual category names
    slug: event.slug,
  })

  return (
    <div className="container py-8 md:py-12">
      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: "Events" }]} className="mb-6" />
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Browse Events</h1>

      {/* Search and Filters */}
      <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events by name or description..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <Filter className="h-4 w-4" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md p-0">
              {/* Pass down current filter state to EventFilters for initial rendering */}
              <EventFilters
                onFiltersChange={handleFiltersChange}
                onClose={() => {}}
                isMobile={true}
                initialFilters={filters} // Pass initial filters
              />
            </SheetContent>
          </Sheet>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date: Soonest</SelectItem>
              <SelectItem value="date-desc">Date: Latest</SelectItem>
              {/* Removed price sorting options as per request */}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active Filters */}
      {activeFiltersCount > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">Active filters:</span>

          {/* Date Range Filter */}
          {(filters.dateRange.from || filters.dateRange.to) && (
            <Badge variant="secondary" className="gap-1">
              {filters.dateRange.from && filters.dateRange.to
                ? `${format(filters.dateRange.from, "MMM d")} - ${format(filters.dateRange.to, "MMM d")}`
                : filters.dateRange.from
                  ? `From ${format(filters.dateRange.from, "MMM d")}`
                  : `Until ${format(filters.dateRange.to!, "MMM d")}`}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() =>
                  setFilters({
                    ...filters,
                    dateRange: { from: undefined, to: undefined },
                  })
                }
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {/* Category Filters (displaying only the first if multiple are somehow selected, to match backend behavior) */}
          {filters.categories.length > 0 && (() => {
              const firstCatFilter = filters.categories[0];
              let displayedName = '';
              if (firstCatFilter.subcategoryIds.length > 0) {
                  const subCategory = allCategories.flatMap(c => c.subCategories || []).find(sc => sc.id === firstCatFilter.subcategoryIds[0]);
                  if (subCategory) {
                      displayedName = subCategory.name;
                  }
              } else if (firstCatFilter.parentId) {
                  const parentCategory = allCategories.find(c => c.id === firstCatFilter.parentId);
                  if (parentCategory) {
                      displayedName = parentCategory.name;
                  }
              }
              if (displayedName) {
                  return (
                      <Badge variant="secondary" className="gap-1">
                          {displayedName}
                          <Button
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 p-0 hover:bg-transparent"
                              onClick={() => setFilters(prev => ({ ...prev, categories: [] }))}
                          >
                              <X className="h-3 w-3" />
                          </Button>
                      </Badge>
                  );
              }
              return null;
          })()}


          {/* Location Filters (displaying only the first if multiple are somehow selected, to match backend behavior) */}
          {filters.locations.length > 0 && (() => {
              const firstLocFilter = filters.locations[0];
              let displayedName = '';
              if (firstLocFilter.cityIds.length > 0) {
                  const cityName = getCityNameById(firstLocFilter.cityIds[0], allVoivodeships);
                  if (cityName) {
                      displayedName = cityName;
                  }
              } else if (firstLocFilter.voivodeshipId) {
                  const voivodeshipName = getVoivodeshipNameById(firstLocFilter.voivodeshipId, allVoivodeships);
                  if (voivodeshipName) {
                      displayedName = voivodeshipName;
                  }
              }
              if (displayedName) {
                  return (
                      <Badge variant="secondary" className="gap-1">
                          {displayedName}
                          <Button
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 p-0 hover:bg-transparent"
                              onClick={() => setFilters(prev => ({ ...prev, locations: [] }))}
                          >
                              <X className="h-3 w-3" />
                          </Button>
                      </Badge>
                  );
              }
              return null;
          })()}


          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={clearAllFilters}>
            Clear all
          </Button>
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-4">
        {/* Desktop Filters Sidebar */}
        <div className="hidden lg:block">
          <div className="sticky top-20 rounded-lg border">
            {/* Pass down current filter state to EventFilters for initial rendering */}
            <EventFilters onFiltersChange={handleFiltersChange} initialFilters={filters} />
          </div>
        </div>

        {/* Events Grid */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-video bg-muted rounded-lg mb-4" />
                  <div className="h-4 bg-muted rounded mb-2" />
                  <div className="h-4 bg-muted rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : eventsData && eventsData.events.length > 0 ? (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {eventsData.events.map((event) => (
                  <EventCard key={event.id} {...convertEventForCard(event)} />
                ))}
              </div>

              {/* Pagination */}
              {eventsData.total_pages > 1 && (
                <div className="mt-8 flex justify-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-4">
                    Page {currentPage} of {eventsData.total_pages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(Math.min(eventsData.total_pages, currentPage + 1))}
                    disabled={currentPage === eventsData.total_pages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          ) : (
            /* Empty State */
            <div className="mt-12 flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-3">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">No events found</h3>
              <p className="mt-2 text-sm text-muted-foreground">Try adjusting your search or filter criteria</p>
              <Button variant="outline" className="mt-4" onClick={clearAllFilters}>
                Reset Filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}