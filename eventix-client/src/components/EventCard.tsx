import { Link } from "react-router"

interface EventCardProps {
  id: string
  title: string
  date: string
  time: string
  location: string
  imageUrl: string
  slug?: string
}

export default function EventCard({
  title,
  date,
  time,
  location,
  imageUrl,
  slug,
}: EventCardProps) {
  const eventUrl = slug ? `/events/${slug}` : `/events/${slug}`
  const imgUrl = "/events/" + imageUrl
  return (
    <Link to={eventUrl} className="group block">
      <article className="relative overflow-hidden rounded-lg border border-gray-100">
        <img alt={title} src={imgUrl || "/placeholder.svg"} className="aspect-square w-full object-cover" />

        <div className="p-4">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>

          <p className="mt-2 text-sm leading-relaxed text-gray-500 line-clamp-3">
            {date} - {time} - {location}
          </p>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-gray-600">View Details</span>
            <span className="text-sm text-gray-400 group-hover:text-gray-600">→</span></div>
        </div>
      </article>
    </Link>
  )
}
