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
import type { Event, UpdateEventRequest } from "../../types/event"
import { DateTimePicker } from "../ui/date-time-picker"

interface EventEditDialogProps {
  event: Event | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (eventId: string, data: UpdateEventRequest) => Promise<void>
}

export function EventEditDialog({ event, open, onOpenChange, onSave }: EventEditDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<UpdateEventRequest>({})
  const [startDate, setStartDate] = useState<Date>()

  useEffect(() => {
    if (event) {
      const eventStartDate = event.start_time ? new Date(event.start_time) : undefined
      setStartDate(eventStartDate)
      setFormData({
        title: event.title,
        slug: event.slug,
        description: event.description,
        start_time: event.start_time || "",
        location_name: event.location_name || "",
        location_address: event.location_address || "",
        is_published: event.is_published,
      })
    }
  }, [event])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        setFormData({ ...formData, image_url: reader.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    if (!event) return

    try {
      setLoading(true)
      const dataToSend = {
        ...formData,
        start_time: startDate ? startDate.toISOString() : undefined,
      }
      await onSave(event.id, dataToSend)
      onOpenChange(false)
    } catch (error) {
      console.error("Error updating event:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!event) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
          <DialogDescription>Make changes to event information.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Event Title</Label>
                  <Input
                    id="title"
                    value={formData.title || ""}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug || ""}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_time">Start Time</Label>
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
                    checked={formData.is_published || false}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                  />
                  <Label htmlFor="is_published">Published</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Location</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="location_name">Venue Name</Label>
                <Input
                  id="location_name"
                  value={formData.location_name || ""}
                  onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="location_address">Address</Label>
                <Input
                  id="location_address"
                  value={formData.location_address || ""}
                  onChange={(e) => setFormData({ ...formData, location_address: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Event Image</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="image">Upload New Image</Label>
                <Input id="image" type="file" accept="image/*" onChange={handleImageUpload} className="mt-1" />
                {event.image_url && (
                  <div className="mt-2">
                    <p className="text-sm text-muted-foreground mb-2">Current image:</p>
                    <img
                      src={event.image_url || "/placeholder.svg"}
                      alt="Current event image"
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
