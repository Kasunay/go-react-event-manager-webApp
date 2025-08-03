/*
import { useState } from "react"
import { TicketIcon as Ticket2, Filter, Search } from "lucide-react"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { TicketCard } from "../components/TicketCard"
import { mockTickets } from "../data/tickets"
import type { Ticket } from "../types/ticket"

export default function MyTicketsPage() {
  const [tickets] = useState<Ticket[]>(mockTickets)
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>(mockTickets)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    filterTickets(value, statusFilter)
  }

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value)
    filterTickets(searchTerm, value)
  }

  const filterTickets = (search: string, status: string) => {
    let filtered = tickets

    if (search) {
      filtered = filtered.filter(
        (ticket) =>
          ticket.eventName.toLowerCase().includes(search.toLowerCase()) ||
          ticket.venue.toLowerCase().includes(search.toLowerCase()) ||
          ticket.category.toLowerCase().includes(search.toLowerCase()),
      )
    }

    if (status !== "all") {
      filtered = filtered.filter((ticket) => ticket.status === status)
    }

    setFilteredTickets(filtered)
  }

  const getTicketCounts = () => {
    return {
      total: tickets.length,
      active: tickets.filter((t) => t.status === "active").length,
      used: tickets.filter((t) => t.status === "used").length,
      expired: tickets.filter((t) => t.status === "expired").length,
    }
  }

  const counts = getTicketCounts()

  return (
    <div className="container mx-auto px-4 py-8">

      <div className="mb-8">
        <div className="flex items-center space-x-2 mb-2">
          <Ticket2 className="h-6 w-6" />
          <h1 className="text-3xl font-bold">My Tickets</h1>
        </div>
        <p className="text-muted-foreground">Manage and view all your event tickets in one place</p>
      </div>

 
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-card rounded-lg border p-4 text-center">
          <div className="text-2xl font-bold">{counts.total}</div>
          <div className="text-sm text-muted-foreground">Total Tickets</div>
        </div>
        <div className="bg-card rounded-lg border p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{counts.active}</div>
          <div className="text-sm text-muted-foreground">Active</div>
        </div>
        <div className="bg-card rounded-lg border p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{counts.used}</div>
          <div className="text-sm text-muted-foreground">Used</div>
        </div>
        <div className="bg-card rounded-lg border p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{counts.expired}</div>
          <div className="text-sm text-muted-foreground">Expired</div>
        </div>
      </div>


      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tickets by event, venue, or category..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={handleStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tickets</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="used">Used</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredTickets.length === 0 ? (
        <div className="text-center py-12">
          <Ticket2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No tickets found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || statusFilter !== "all"
              ? "Try adjusting your search or filter criteria"
              : "You haven't purchased any tickets yet"}
          </p>
          {!searchTerm && statusFilter === "all" && (
            <Button asChild>
              <a href="/events">Browse Events</a>
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {filteredTickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
        </div>
      )}
    </div>
  )
}
*/