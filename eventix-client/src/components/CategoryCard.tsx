import type React from "react"
import { Link } from "react-router"
import {
  ArrowRight,
  Music,
  Trophy,
  Palette,
  Presentation,
  Utensils,
  BookOpen,
  Tent,
  Moon,
  Sparkles,
} from "lucide-react"
import { Card, CardContent } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import type { Category } from "../services/api"

// Map of category slugs to icons
const categoryIcons: Record<string, React.ReactNode> = {
  music: <Music className="h-8 w-8" />,
  sports: <Trophy className="h-8 w-8" />,
  arts: <Palette className="h-8 w-8" />,
  theater: <Palette className="h-8 w-8" />,
  conferences: <Presentation className="h-8 w-8" />,
  technology: <Presentation className="h-8 w-8" />,
  food: <Utensils className="h-8 w-8" />,
  workshops: <BookOpen className="h-8 w-8" />,
  festivals: <Tent className="h-8 w-8" />,
  nightlife: <Moon className="h-8 w-8" />,
  entertainment: <Sparkles className="h-8 w-8" />,
  business: <Presentation className="h-8 w-8" />,
  education: <BookOpen className="h-8 w-8" />,
  health: <BookOpen className="h-8 w-8" />,
  culture: <Palette className="h-8 w-8" />,
}

// Color schemes for different categories
const categoryColors: Record<string, string> = {
  music: "from-purple-500/20 to-pink-500/20 border-purple-200 dark:border-purple-800",
  sports: "from-orange-500/20 to-red-500/20 border-orange-200 dark:border-orange-800",
  arts: "from-blue-500/20 to-indigo-500/20 border-blue-200 dark:border-blue-800",
  theater: "from-blue-500/20 to-indigo-500/20 border-blue-200 dark:border-blue-800",
  conferences: "from-green-500/20 to-emerald-500/20 border-green-200 dark:border-green-800",
  technology: "from-green-500/20 to-emerald-500/20 border-green-200 dark:border-green-800",
  food: "from-yellow-500/20 to-orange-500/20 border-yellow-200 dark:border-yellow-800",
  workshops: "from-teal-500/20 to-cyan-500/20 border-teal-200 dark:border-teal-800",
  festivals: "from-rose-500/20 to-pink-500/20 border-rose-200 dark:border-rose-800",
  nightlife: "from-violet-500/20 to-purple-500/20 border-violet-200 dark:border-violet-800",
  entertainment: "from-violet-500/20 to-purple-500/20 border-violet-200 dark:border-violet-800",
  business: "from-green-500/20 to-emerald-500/20 border-green-200 dark:border-green-800",
  education: "from-teal-500/20 to-cyan-500/20 border-teal-200 dark:border-teal-800",
  health: "from-teal-500/20 to-cyan-500/20 border-teal-200 dark:border-teal-800",
  culture: "from-blue-500/20 to-indigo-500/20 border-blue-200 dark:border-blue-800",
}

interface CategoryCardProps {
  category: Category
  compact?: boolean
}

export default function CategoryCard({ category, compact = false }: CategoryCardProps) {
  return (
    <Link to={`/categories/${category.slug}`} className="group h-full">
      <Card
        className={`relative flex h-full w-full flex-col overflow-hidden border-2 bg-gradient-to-br transition-all duration-300 hover:scale-105 hover:shadow-xl ${categoryColors[category.slug] || "from-gray-500/20 to-gray-600/20 border-gray-200 dark:border-gray-800"}`}
      >
        <CardContent className={`${compact ? "p-4" : "p-6"} flex flex-1 flex-col justify-between`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div
                className={`mb-3 inline-flex rounded-2xl bg-background/80 p-${compact ? "2" : "3"} backdrop-blur-sm`}
              >
                {categoryIcons[category.slug] || (
                  <Sparkles className={`h-${compact ? "6" : "8"} w-${compact ? "6" : "8"}`} />
                )}
              </div>
              <h3 className={`${compact ? "text-lg" : "text-xl"} font-bold group-hover:text-primary transition-colors`}>
                {category.name}
              </h3>
            </div>
            <ArrowRight
              className={`h-${compact ? "5" : "6"} w-${compact ? "5" : "6"} text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-primary`}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {category.subCategories?.slice(0, compact ? 2 : 3).map((subcategory) => (
              <Badge key={subcategory.id} variant="secondary" className="text-xs">
                {subcategory.name}
              </Badge>
            ))}
            {(category.subCategories?.length || 0) > (compact ? 2 : 3) && (
              <Badge variant="outline" className="text-xs">
                +{(category.subCategories?.length || 0) - (compact ? 2 : 3)}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
