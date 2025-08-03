export interface Subcategory {
  id: number
  name: string
  slug: string
  icon?: string
  description?: string
}

export interface Category {
  id: number
  name: string
  slug: string
  icon?: string
  description?: string
  subCategories: Subcategory[]
  featured?: boolean
}

export const categories: Category[] = [
  {
    id: 1,
    name: "Music",
    slug: "music",
    icon: "music",
    description: "Live concerts, festivals, and performances across all genres",
    featured: true,
    subCategories: [
      { id: 1, name: "Rock", slug: "rock", description: "Rock concerts and festivals" },
      { id: 2, name: "Pop", slug: "pop", description: "Pop music concerts and tours" },
      { id: 3, name: "Electronic", slug: "electronic", description: "EDM, techno, and electronic music events" },
      { id: 4, name: "Jazz", slug: "jazz", description: "Jazz festivals and performances" },
      { id: 5, name: "Classical", slug: "classical", description: "Symphony, opera, and classical performances" },
      { id: 6, name: "Hip Hop", slug: "hip-hop", description: "Hip hop and rap concerts" },
      { id: 7, name: "Indie", slug: "indie", description: "Independent music events" },
      { id: 8, name: "Folk", slug: "folk", description: "Folk music festivals and concerts" },
    ],
  },
  {
    id: 2,
    name: "Sports",
    slug: "sports",
    icon: "trophy",
    description: "Sporting events, tournaments, and competitions",
    featured: true,
    subCategories: [
      { id: 9, name: "Football", slug: "football", description: "Football matches and tournaments" },
      { id: 10, name: "Basketball", slug: "basketball", description: "Basketball games and championships" },
      { id: 11, name: "Tennis", slug: "tennis", description: "Tennis tournaments and matches" },
      { id: 12, name: "Golf", slug: "golf", description: "Golf tournaments and competitions" },
      { id: 13, name: "Motorsports", slug: "motorsports", description: "Racing events and motorsports" },
      { id: 14, name: "Baseball", slug: "baseball", description: "Baseball games and tournaments" },
      { id: 15, name: "Hockey", slug: "hockey", description: "Hockey matches and tournaments" },
      { id: 16, name: "Soccer", slug: "soccer", description: "Soccer matches and tournaments" },
    ],
  },
  {
    id: 3,
    name: "Arts & Theater",
    slug: "arts",
    icon: "palette",
    description: "Theater performances, art exhibitions, and cultural events",
    featured: true,
    subCategories: [
      { id: 17, name: "Theater", slug: "theater", description: "Plays and theatrical performances" },
      { id: 18, name: "Comedy", slug: "comedy", description: "Stand-up comedy and comedy shows" },
      { id: 19, name: "Dance", slug: "dance", description: "Dance performances and recitals" },
      { id: 20, name: "Exhibition", slug: "exhibition", description: "Art exhibitions and gallery events" },
      { id: 21, name: "Opera", slug: "opera", description: "Opera performances" },
      { id: 22, name: "Ballet", slug: "ballet", description: "Ballet performances" },
      { id: 23, name: "Musical", slug: "musical", description: "Musical theater performances" },
      { id: 24, name: "Circus", slug: "circus", description: "Circus and acrobatic performances" },
    ],
  },
  {
    id: 4,
    name: "Conferences",
    slug: "conferences",
    icon: "presentation",
    description: "Professional conferences, seminars, and workshops",
    subCategories: [
      { id: 25, name: "Technology", slug: "tech", description: "Tech conferences and expos" },
      { id: 26, name: "Business", slug: "business", description: "Business and entrepreneurship events" },
      { id: 27, name: "Science", slug: "science", description: "Scientific conferences and symposiums" },
      { id: 28, name: "Medical", slug: "medical", description: "Medical conferences and healthcare events" },
      { id: 29, name: "Education", slug: "education", description: "Educational conferences and workshops" },
      { id: 30, name: "Design", slug: "design", description: "Design conferences and exhibitions" },
      { id: 31, name: "Marketing", slug: "marketing", description: "Marketing and advertising events" },
      { id: 32, name: "Finance", slug: "finance", description: "Finance and investment conferences" },
    ],
  },
  {
    id: 5,
    name: "Food & Drink",
    slug: "food",
    icon: "utensils",
    description: "Food festivals, tastings, and culinary events",
    subCategories: [
      { id: 33, name: "Food Festival", slug: "festival", description: "Food festivals and culinary events" },
      { id: 34, name: "Wine Tasting", slug: "wine", description: "Wine tastings and vineyard events" },
      { id: 35, name: "Beer Festival", slug: "beer", description: "Beer festivals and brewery events" },
      { id: 36, name: "Cooking Class", slug: "cooking", description: "Cooking classes and workshops" },
      { id: 37, name: "Tasting Event", slug: "tasting", description: "Food and beverage tasting events" },
      { id: 38, name: "Special Dinner", slug: "dinner", description: "Special dining experiences and pop-ups" },
      { id: 39, name: "Cocktail Event", slug: "cocktail", description: "Cocktail tastings and mixology events" },
      { id: 40, name: "Food Tour", slug: "food-tour", description: "Guided food tours and culinary experiences" },
    ],
  },
  {
    id: 6,
    name: "Workshops & Classes",
    slug: "workshops",
    icon: "book-open",
    description: "Educational workshops, classes, and learning experiences",
    subCategories: [
      { id: 41, name: "Art & Craft", slug: "art-craft", description: "Art and craft workshops" },
      { id: 42, name: "Technology", slug: "technology", description: "Technology and coding workshops" },
      { id: 43, name: "Business", slug: "business", description: "Business and entrepreneurship classes" },
      { id: 44, name: "Wellness", slug: "wellness", description: "Health and wellness workshops" },
      { id: 45, name: "Language", slug: "language", description: "Language classes and workshops" },
      { id: 46, name: "Photography", slug: "photography", description: "Photography classes and workshops" },
      { id: 47, name: "Writing", slug: "writing", description: "Writing workshops and literary events" },
      { id: 48, name: "Music", slug: "music", description: "Music lessons and workshops" },
    ],
  },
  {
    id: 7,
    name: "Festivals & Fairs",
    slug: "festivals",
    icon: "tent",
    description: "Cultural festivals, fairs, and celebrations",
    subCategories: [
      { id: 49, name: "Cultural Festival", slug: "cultural", description: "Cultural and heritage festivals" },
      { id: 50, name: "Film Festival", slug: "film", description: "Film festivals and screenings" },
      { id: 51, name: "Music Festival", slug: "music-fest", description: "Multi-day music festivals" },
      { id: 52, name: "Art Fair", slug: "art-fair", description: "Art fairs and exhibitions" },
      { id: 53, name: "Street Fair", slug: "street-fair", description: "Street fairs and block parties" },
      { id: 54, name: "Carnival", slug: "carnival", description: "Carnivals and amusement events" },
      { id: 55, name: "Seasonal", slug: "seasonal", description: "Seasonal and holiday festivals" },
      { id: 56, name: "Renaissance", slug: "renaissance", description: "Renaissance fairs and historical events" },
    ],
  },
  {
    id: 8,
    name: "Nightlife",
    slug: "nightlife",
    icon: "moon",
    description: "Nightclubs, parties, and evening entertainment",
    subCategories: [
      { id: 57, name: "Nightclub", slug: "club", description: "Nightclub events and parties" },
      { id: 58, name: "Bar Event", slug: "bar", description: "Special bar events and tastings" },
      { id: 59, name: "Party", slug: "party", description: "Themed parties and celebrations" },
      { id: 60, name: "DJ Event", slug: "dj", description: "DJ performances and sets" },
      { id: 61, name: "Dance Party", slug: "dance", description: "Dance parties and socials" },
      { id: 62, name: "Karaoke", slug: "karaoke", description: "Karaoke nights and singing events" },
      { id: 63, name: "Comedy Night", slug: "comedy-night", description: "Comedy nights at bars and clubs" },
      { id: 64, name: "Pub Crawl", slug: "pub-crawl", description: "Organized pub crawls and bar tours" },
    ],
  },
]
