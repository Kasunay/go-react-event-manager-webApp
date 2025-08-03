"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "../../components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Textarea } from "../../components/ui/textarea"
import { Switch } from "../../components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Plus, Trash2 } from "lucide-react"
import type { CreateEventRequest, TicketTypeRequest } from "../../types/event"
import { apiService, type Category, type VoivodeshipWithCities } from "../../services/api"
import { toast } from "sonner"
import { DateTimePicker } from "../ui/date-time-picker"

interface EventCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (data: CreateEventRequest) => Promise<void>
}

export function EventCreateDialog({ open, onOpenChange, onCreate }: EventCreateDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<CreateEventRequest>({
    title: "",
    slug: "",
    description: "",
    start_time: "",
    location_name: "",
    location_address: "",
    image_url: "",
    is_published: false,
    city_id: 1,
    category_ids: [1],
    ticket_types: [
      {
        name: "General Admission",
        description: "Standard ticket",
        price_cents: 1000,
        total_quantity: 100,
      },
    ],
  })

  const [startDate, setStartDate] = useState<Date>()
  const [categories, setCategories] = useState<Category[]>([])
  const [locations, setLocations] = useState<VoivodeshipWithCities[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [imagePreview, setImagePreview] = useState<string>("")

  // Fetch categories and cities from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setDataLoading(true)
        const [categoriesData, locationsData] = await Promise.all([
          apiService.getCategories(),
          apiService.getVoivodeshipsWithCities(),
        ])

        setCategories(categoriesData)
        setLocations(locationsData)
      } catch (error) {
        console.error("Error fetching data:", error)
        toast.error("Failed to load categories and cities")
      } finally {
        setDataLoading(false)
      }
    }

    if (open) {
      fetchData()
    }
  }, [open])

const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = () => {
      const fullDataUrl = reader.result as string
      // Set the full data URL for preview
      setImagePreview(fullDataUrl)
      // Split the data URL at the first comma and take the second part (the base64 data)
      const base64Data = fullDataUrl.split(',')[1]
      if (base64Data) {
        setFormData({ ...formData, image_url: base64Data })
      } else {
        // Handle cases where splitting might fail, though unlikely for valid data URLs
        console.error("Could not extract base64 data from image.")
        toast.error("Error processing image.")
      }
    }
    reader.readAsDataURL(file)
  }
}

  const addTicketType = () => {
    setFormData({
      ...formData,
      ticket_types: [
        ...formData.ticket_types,
        {
          name: "",
          description: "",
          price_cents: 1000,
          total_quantity: 100,
        },
      ],
    })
  }

  const removeTicketType = (index: number) => {
    setFormData({
      ...formData,
      ticket_types: formData.ticket_types.filter((_, i) => i !== index),
    })
  }

  const updateTicketType = (index: number, field: keyof TicketTypeRequest, value: any) => {
    const updatedTicketTypes = [...formData.ticket_types]
    updatedTicketTypes[index] = { ...updatedTicketTypes[index], [field]: value }
    setFormData({ ...formData, ticket_types: updatedTicketTypes })
  }

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
  }

  const handleTitleChange = (title: string) => {
    setFormData({
      ...formData,
      title,
      slug: generateSlug(title),
    })
  }

  const handleCreate = async () => {
    try {
      setLoading(true)
      // Ensure start_time is properly formatted
      const dataToSubmit = {
        ...formData,
        start_time: startDate ? startDate.toISOString() : "",
      }
      await onCreate(dataToSubmit)
      onOpenChange(false)
      // Reset form
      setStartDate(undefined)
      setImagePreview("")
      setFormData({
        title: "",
        slug: "",
        description: "",
        start_time: "",
        location_name: "",
        location_address: "",
        image_url: "",
        is_published: false,
        city_id: 1,
        category_ids: [1],
        ticket_types: [
          {
            name: "General Admission",
            description: "Standard ticket",
            price_cents: 1000,
            total_quantity: 100,
          },
        ],
      })
    } catch (error) {
      console.error("Error creating event:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
          <DialogDescription>Fill in the event details to create a new event.</DialogDescription>
        </DialogHeader>

        {dataLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading categories and cities...</span>
          </div>
        ) : (
          <div className="grid gap-6 py-4">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Event Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder="Enter event title"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="slug">Slug *</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="event-slug"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Event description"
                    rows={3}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_time">Start Time *</Label>
                    <DateTimePicker
                      date={startDate}
                      onDateChange={(date) => {
                        setStartDate(date)
                        setFormData({
                          ...formData,
                          start_time: date ? date.toISOString() : "",
                        })
                      }}
                      placeholder="Select event start time"
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <Switch
                      id="is_published"
                      checked={formData.is_published}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                    />
                    <Label htmlFor="is_published">Publish immediately</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Location</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="location_name">Venue Name</Label>
                    <Input
                      id="location_name"
                      value={formData.location_name}
                      onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
                      placeholder="Venue name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city_id">City *</Label>
                    <select
                      id="city_id"
                      value={formData.city_id}
                      onChange={(e) => setFormData({ ...formData, city_id: Number(e.target.value) })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      required
                    >
                      <option value="">Select a city</option>
                      {locations.map((voivodeship) =>
                        voivodeship.cities.map((city) => (
                          <option key={city.id} value={city.id}>
                            {city.name} ({voivodeship.name})
                          </option>
                        )),
                      )}
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="location_address">Address</Label>
                  <Input
                    id="location_address"
                    value={formData.location_address}
                    onChange={(e) => setFormData({ ...formData, location_address: e.target.value })}
                    placeholder="Full address"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label>Select Categories *</Label>
                  <div className="mt-2 space-y-2 max-h-40 overflow-y-auto border rounded-md p-3">
                    {categories.map((category) => (
                      <div key={category.id} className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`category-${category.id}`}
                            checked={formData.category_ids.includes(category.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  category_ids: [...formData.category_ids, category.id],
                                })
                              } else {
                                setFormData({
                                  ...formData,
                                  category_ids: formData.category_ids.filter((id) => id !== category.id),
                                })
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                          <Label htmlFor={`category-${category.id}`} className="font-medium">
                            {category.name}
                          </Label>
                        </div>
                        {category.subCategories && category.subCategories.length > 0 && (
                          <div className="ml-6 space-y-1">
                            {category.subCategories.map((subCategory) => (
                              <div key={subCategory.id} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={`subcategory-${subCategory.id}`}
                                  checked={formData.category_ids.includes(subCategory.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setFormData({
                                        ...formData,
                                        category_ids: [...formData.category_ids, subCategory.id],
                                      })
                                    } else {
                                      setFormData({
                                        ...formData,
                                        category_ids: formData.category_ids.filter((id) => id !== subCategory.id),
                                      })
                                    }
                                  }}
                                  className="rounded border-gray-300"
                                />
                                <Label htmlFor={`subcategory-${subCategory.id}`} className="text-sm">
                                  {subCategory.name}
                                </Label>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {formData.category_ids.length === 0 && (
                    <p className="text-sm text-red-500 mt-1">Please select at least one category</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Image Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Event Image</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="image">Upload Image</Label>
                  <Input id="image" type="file" accept="image/*" onChange={handleImageUpload} className="mt-1" />
                  {imagePreview && (
                    <div className="mt-2">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Ticket Types */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  Ticket Types
                  <Button type="button" onClick={addTicketType} size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Ticket Type
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.ticket_types.map((ticketType, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Ticket Type {index + 1}</h4>
                      {formData.ticket_types.length > 1 && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeTicketType(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Name *</Label>
                        <Input
                          value={ticketType.name}
                          onChange={(e) => updateTicketType(index, "name", e.target.value)}
                          placeholder="Ticket name"
                          required
                        />
                      </div>
                      <div>
                        <Label>Price (cents) *</Label>
                        <Input
                          type="number"
                          value={ticketType.price_cents}
                          onChange={(e) => updateTicketType(index, "price_cents", Number.parseInt(e.target.value))}
                          placeholder="1000"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Description</Label>
                        <Input
                          value={ticketType.description}
                          onChange={(e) => updateTicketType(index, "description", e.target.value)}
                          placeholder="Ticket description"
                        />
                      </div>
                      <div>
                        <Label>Total Quantity *</Label>
                        <Input
                          type="number"
                          value={ticketType.total_quantity}
                          onChange={(e) => updateTicketType(index, "total_quantity", Number.parseInt(e.target.value))}
                          placeholder="100"
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleCreate} disabled={loading}>
            {loading ? "Creating..." : "Create Event"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
