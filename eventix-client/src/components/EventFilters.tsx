// EventFilters.tsx
"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { CalendarIcon, Check, ChevronsUpDown, X } from "lucide-react"
import { Button } from "../components/ui/button"
import { Calendar } from "../components/ui/calendar"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../components/ui/accordion"
import { Checkbox } from "../components/ui/checkbox"
import { Label } from "../components/ui/label"
import { Separator } from "../components/ui/separator"
import { cn } from "../lib/utils"
import { Badge } from "../components/ui/badge"
import { apiService, type VoivodeshipWithCities, type Category } from "../services/api"
import { toast } from "sonner"

interface EventFiltersProps {
  onFiltersChange: (filters: FilterState) => void
  onClose?: () => void
  isMobile?: boolean
  initialFilters?: FilterState // New prop for initial state
}

export interface FilterState {
  dateRange: {
    from: Date | undefined
    to: Date | undefined
  }
  categories: {
    parentId: number
    subcategoryIds: number[]
  }[]
  locations: {
    voivodeshipId: number
    cityIds: number[]
  }[]
}

export default function EventFilters({ onFiltersChange, onClose, isMobile = false, initialFilters }: EventFiltersProps) {
  const [date, setDate] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: undefined,
    to: undefined,
  })

  // State to manage selected categories (internal to EventFilters)
  const [selectedCategories, setSelectedCategories] = useState<{
    [parentId: number]: {
      checked: boolean // true if parent category is selected
      subcategories: { [id: number]: boolean } // true if subcategory is selected
    }
  }>({})

  // State to manage selected locations (internal to EventFilters)
  const [selectedLocations, setSelectedLocations] = useState<{
    [voivodeshipId: number]: {
      checked: boolean // true if voivodeship is selected
      cities: { [id: number]: boolean } // true if city is selected
    }
  }>({})

  const [activeVoivodeship, setActiveVoivodeship] = useState<number | null>(null)
  const [citySearchTerm, setCitySearchTerm] = useState("")

  // API data
  const [categories, setCategories] = useState<Category[]>([])
  const [locations, setLocations] = useState<VoivodeshipWithCities[]>([])
  const [loading, setLoading] = useState(true)

  // Effect to sync internal state with initialFilters prop
  useEffect(() => {
    if (initialFilters) {
      setDate(initialFilters.dateRange);

      // Reconstruct selectedCategories for internal state
      const newSelectedCategories: { [parentId: number]: { checked: boolean; subcategories: { [id: number]: boolean } } } = {};
      initialFilters.categories.forEach(catFilter => {
        newSelectedCategories[catFilter.parentId] = {
          checked: false, // If there are specific subcategory IDs, parent is not "checked" in the blanket sense
          subcategories: catFilter.subcategoryIds.reduce((acc, subId) => ({ ...acc, [subId]: true }), {})
        };
        // If a parent was selected without specific subcategories (meaning all subcategories under it are implicitly selected)
        // This part might need adjustment based on how you want the "checked" state to reflect "all subcategories" vs "just parent"
        // For simplicity, we'll assume if parentId is present in initialFilters, it implies a parent selection
        // However, the backend only takes *one* category_slug OR parent_category_slug
        // The most robust way to handle this on the frontend given backend constraints is to only track ONE active category/location filter
        if (catFilter.parentId && catFilter.subcategoryIds.length === 0) {
            newSelectedCategories[catFilter.parentId].checked = true;
        }
      });
      setSelectedCategories(newSelectedCategories);

      // Reconstruct selectedLocations for internal state
      const newSelectedLocations: { [voivodeshipId: number]: { checked: boolean; cities: { [id: number]: boolean } } } = {};
      initialFilters.locations.forEach(locFilter => {
        newSelectedLocations[locFilter.voivodeshipId] = {
          checked: false, // Similar to categories, if specific city IDs, voivodeship is not "checked" in blanket sense
          cities: locFilter.cityIds.reduce((acc, cityId) => ({ ...acc, [cityId]: true }), {})
        };
        // If a voivodeship was selected without specific city IDs
        if (locFilter.voivodeshipId && locFilter.cityIds.length === 0) {
            newSelectedLocations[locFilter.voivodeshipId].checked = true;
        }
      });
      setSelectedLocations(newSelectedLocations);
    }
  }, [initialFilters]);


  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [categoriesData, locationsData] = await Promise.all([
          apiService.getCategories(),
          apiService.getVoivodeshipsWithCities(),
        ])

        setCategories(categoriesData)
        setLocations(locationsData)
      } catch (error) {
        console.error("Error fetching filter data:", error)
        toast.error("Failed to load filter options")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Handle category selection
  const handleCategoryChange = (parentId: number, checked: boolean) => {
    setSelectedCategories((prev) => {
        // Clear all other categories if a new one is selected
        const newSelected: typeof prev = {};

        if (checked) {
            newSelected[parentId] = {
                checked: true,
                subcategories: {}, // No subcategories selected when parent is directly checked
            };
        }
        return newSelected;
    });
  };

  // Handle subcategory selection
  const handleSubcategoryChange = (parentId: number, subcategoryId: number, checked: boolean) => {
    setSelectedCategories((prev) => {
        // Clear all other categories if a new one is selected
        const newSelected: typeof prev = {};

        if (checked) {
            newSelected[parentId] = {
                checked: false, // Parent checkbox should not be checked if a specific subcategory is
                subcategories: { [subcategoryId]: true },
            };
        }
        return newSelected;
    });
  };

  // Handle voivodeship selection
  const handleVoivodeshipChange = (voivodeshipId: number, checked: boolean) => {
    setSelectedLocations((prev) => {
        // Clear all other locations if a new one is selected
        const newSelected: typeof prev = {};

        if (checked) {
            newSelected[voivodeshipId] = {
                checked: true,
                cities: {}, // No cities selected when voivodeship is directly checked
            };
        }
        return newSelected;
    });
  };

  // Handle city selection
  const handleCityChange = (voivodeshipId: number, cityId: number, checked: boolean) => {
    setSelectedLocations((prev) => {
        // Clear all other locations if a new one is selected
        const newSelected: typeof prev = {};

        if (checked) {
            newSelected[voivodeshipId] = {
                checked: false, // Voivodeship checkbox should not be checked if a specific city is
                cities: { [cityId]: true },
            };
        }
        return newSelected;
    });
  };

  // Apply filters
  const applyFilters = () => {
    // Transform selected categories into the format expected by the parent component
    // We only take the first (and ideally only) active filter
    const categoryFilters: FilterState['categories'] = [];
    const activeParentId = Object.keys(selectedCategories).find(id => selectedCategories[Number(id)].checked);
    const activeSubcategoryId = Object.keys(selectedCategories).find(id =>
        Object.values(selectedCategories[Number(id)].subcategories || {}).some(Boolean)
    );

    if (activeSubcategoryId) {
        // Find the parent of the active subcategory
        let parentOfSub = categories.find(cat => cat.subCategories?.some(sub => sub.id === Number(activeSubcategoryId)));
        if (parentOfSub) {
            categoryFilters.push({
                parentId: parentOfSub.id,
                subcategoryIds: [Number(activeSubcategoryId)],
            });
        }
    } else if (activeParentId) {
        categoryFilters.push({
            parentId: Number(activeParentId),
            subcategoryIds: [], // No specific subcategories selected, just the parent
        });
    }

    // Transform selected locations into the format expected by the parent component
    // We only take the first (and ideally only) active filter
    const locationFilters: FilterState['locations'] = [];
    const activeVoivodeshipId = Object.keys(selectedLocations).find(id => selectedLocations[Number(id)].checked);
    const activeCityId = Object.keys(selectedLocations).find(id =>
        Object.values(selectedLocations[Number(id)].cities || {}).some(Boolean)
    );

    if (activeCityId) {
        // Find the voivodeship of the active city
        let voivodeshipOfCity = locations.find(voiv => voiv.cities?.some(city => city.id === Number(activeCityId)));
        if (voivodeshipOfCity) {
            locationFilters.push({
                voivodeshipId: voivodeshipOfCity.id,
                cityIds: [Number(activeCityId)],
            });
        }
    } else if (activeVoivodeshipId) {
        locationFilters.push({
            voivodeshipId: Number(activeVoivodeshipId),
            cityIds: [], // No specific cities selected, just the voivodeship
        });
    }


    // Create the filter state
    const filterState: FilterState = {
      dateRange: date,
      categories: categoryFilters,
      locations: locationFilters,
    }

    // Pass the filter state to the parent component
    onFiltersChange(filterState)

    // Close the filter panel on mobile
    if (isMobile && onClose) {
      onClose()
    }
  }

  // Reset filters
  const resetFilters = () => {
    setDate({ from: undefined, to: undefined })
    setSelectedCategories({})
    setSelectedLocations({})

    // Apply the reset filters
    onFiltersChange({
      dateRange: { from: undefined, to: undefined },
      categories: [],
      locations: [],
    })
  }

  // Count active filters (updated to reflect the single-selection logic)
  const getActiveFiltersCount = () => {
    let count = 0

    // Date range
    if (date.from || date.to) count++

    // Categories (count as 1 if any category is selected)
    const hasActiveCategory = Object.values(selectedCategories).some(category =>
        category.checked || Object.values(category.subcategories || {}).some(Boolean)
    );
    if (hasActiveCategory) count++;

    // Locations (count as 1 if any location is selected)
    const hasActiveLocation = Object.values(selectedLocations).some(location =>
        location.checked || Object.values(location.cities || {}).some(Boolean)
    );
    if (hasActiveLocation) count++;

    return count
  }

  // Get filtered cities based on search term
  const getFilteredCities = (voivodeshipId: number) => {
    const voivodeship = locations.find((v) => v.id === voivodeshipId)
    if (!voivodeship) return []

    return voivodeship.cities.filter((city) => city.name.toLowerCase().includes(citySearchTerm.toLowerCase()))
  }

  if (loading) {
    return (
      <div className={cn("flex flex-col", isMobile ? "h-[calc(100vh-4rem)]" : "")}>
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Filters</h3>
          {isMobile && onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading filters...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col", isMobile ? "h-[calc(100vh-4rem)]" : "")}>
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold">Filters</h3>
        {isMobile && onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* Date Range */}
        <div>
          <h4 className="font-medium mb-2">Date Range</h4>
          <div className="grid gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !date.from && !date.to && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date.from ? (
                    date.to ? (
                      <>
                        {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(date.from, "LLL dd, y")
                    )
                  ) : (
                    "Select date range"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={date.from}
                  selected={date}
                  onSelect={(range) =>
                    setDate({
                      from: range?.from,
                      to: range?.to ?? undefined,
                    })
                  }
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>

            {(date.from || date.to) && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-1 h-auto p-0 text-muted-foreground"
                onClick={() => setDate({ from: undefined, to: undefined })}
              >
                Clear dates
              </Button>
            )}
          </div>
        </div>

        <Separator />

        {/* Categories */}
        <div>
          <h4 className="font-medium mb-2">Categories</h4>
          <Accordion type="single" collapsible className="w-full"> {/* Changed to single accordion for single selection */}
            {categories.map((category) => (
              <AccordionItem key={category.id} value={category.id.toString()}>
                <div className="flex items-center space-x-2 py-4">
                  <Checkbox
                    id={`category-${category.id}`}
                    checked={selectedCategories[category.id]?.checked || false}
                    onCheckedChange={(checked) => handleCategoryChange(category.id, checked === true)}
                  />
                  <Label htmlFor={`category-${category.id}`} className="flex-1 font-medium cursor-pointer">
                    {category.name}
                  </Label>
                  {category.subCategories && category.subCategories.length > 0 && (
                    <AccordionTrigger className="h-4 w-4 p-0" />
                  )}
                </div>
                {category.subCategories && category.subCategories.length > 0 && (
                  <AccordionContent>
                    <div className="ml-6 space-y-2">
                      {category.subCategories.map((subcategory) => (
                        <div key={subcategory.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`subcategory-${subcategory.id}`}
                            checked={selectedCategories[category.id]?.subcategories?.[subcategory.id] || false}
                            onCheckedChange={(checked) =>
                              handleSubcategoryChange(category.id, subcategory.id, checked === true)
                            }
                          />
                          <Label htmlFor={`subcategory-${subcategory.id}`} className="cursor-pointer">
                            {subcategory.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                )}
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <Separator />

        {/* Locations */}
        <div>
          <h4 className="font-medium mb-2">Locations</h4>
          <Accordion type="single" collapsible className="w-full"> {/* Changed to single accordion for single selection */}
            {locations.map((voivodeship) => (
              <AccordionItem key={voivodeship.id} value={voivodeship.id.toString()}>
                <div className="flex items-center space-x-2 py-4">
                  <Checkbox
                    id={`voivodeship-${voivodeship.id}`}
                    checked={selectedLocations[voivodeship.id]?.checked || false}
                    onCheckedChange={(checked) => handleVoivodeshipChange(voivodeship.id, checked === true)}
                  />
                  <Label htmlFor={`voivodeship-${voivodeship.id}`} className="flex-1 font-medium cursor-pointer">
                    {voivodeship.name}
                  </Label>
                  <AccordionTrigger
                    className="h-4 w-4 p-0"
                    onClick={() => {
                      setActiveVoivodeship(activeVoivodeship === voivodeship.id ? null : voivodeship.id)
                      setCitySearchTerm("")
                    }}
                  />
                </div>
                <AccordionContent>
                  <div className="ml-6 space-y-2">
                    <div className="mb-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" role="combobox" className="w-full justify-between">
                            {citySearchTerm || "Search cities..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput
                              placeholder="Search cities..."
                              value={citySearchTerm}
                              onValueChange={setCitySearchTerm}
                            />
                            <CommandList>
                              <CommandEmpty>No cities found.</CommandEmpty>
                              <CommandGroup>
                                {getFilteredCities(voivodeship.id).map((city) => (
                                  <CommandItem
                                    key={city.id}
                                    value={city.name}
                                    onSelect={() => {
                                      const isSelected = selectedLocations[voivodeship.id]?.cities?.[city.id] || false
                                      handleCityChange(voivodeship.id, city.id, !isSelected)
                                    }}
                                  >
                                    <Checkbox
                                      className="mr-2 h-4 w-4"
                                      checked={selectedLocations[voivodeship.id]?.cities?.[city.id] || false}
                                    />
                                    {city.name}
                                    {selectedLocations[voivodeship.id]?.cities?.[city.id] && (
                                      <Check className="ml-auto h-4 w-4" />
                                    )}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Selected cities badges */}
                    <div className="flex flex-wrap gap-2">
                      {voivodeship.cities
                        .filter((city) => selectedLocations[voivodeship.id]?.cities?.[city.id])
                        .map((city) => (
                          <Badge key={city.id} variant="secondary" className="gap-1">
                            {city.name}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 p-0 hover:bg-transparent"
                              onClick={() => handleCityChange(voivodeship.id, city.id, false)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>

      <div className="border-t p-4 mt-auto">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" onClick={resetFilters}>
            Reset
          </Button>
          <div className="text-sm text-muted-foreground">
            {getActiveFiltersCount()} {getActiveFiltersCount() === 1 ? "filter" : "filters"} applied
          </div>
        </div>
        <Button className="w-full" onClick={applyFilters}>
          Apply Filters
        </Button>
      </div>
    </div>
  )
}