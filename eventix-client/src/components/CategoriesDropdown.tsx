"use client"
import { Link } from "react-router"
import { ChevronDown } from "lucide-react"
import { Button } from "../components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "../components/ui/navigation-menu"
// import { categories } from "../data/categories" // Removed static import
import { useEffect, useState } from "react"
import { apiService, type Category } from "../services/api" // Adjusted import path

export function CategoriesDropdownMobile() {
  const [categories, setCategories] = useState<Category[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const fetchedCategories = await apiService.getCategories()
        setCategories(fetchedCategories)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch categories")
        console.error("Error fetching categories:", err)
      }
    }
    fetchCategories()
  }, [])

  if (error) {
    // Optionally render an error message or a fallback UI
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-1 px-2">
            Categories
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuItem>Error loading categories</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-1 px-2">
          Categories
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {categories.map((category) => (
          <DropdownMenuItem key={category.slug} asChild>
            <Link to={`/categories/${category.slug}`}>{category.name}</Link>
          </DropdownMenuItem>
        ))}
        {categories.length > 0 && <DropdownMenuSeparator />}
        <DropdownMenuItem asChild>
          <Link to="/categories">View All Categories</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function CategoriesDropdownDesktop() {
  const [categories, setCategories] = useState<Category[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const fetchedCategories = await apiService.getCategories()
        setCategories(fetchedCategories)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch categories")
        console.error("Error fetching categories:", err)
      }
    }
    fetchCategories()
  }, [])

  if (error) {
    // Optionally render an error message or a fallback UI
    return (
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Categories</NavigationMenuTrigger>
            <NavigationMenuContent>
              <div className="p-4">Error loading categories.</div>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    )
  }

  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Categories</NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="grid w-[600px] grid-cols-2 gap-3 p-4 md:grid-cols-3">
              {categories.map((category) => (
                <div key={category.slug} className="space-y-3">
                  <NavigationMenuLink asChild>
                    <Link
                      to={`/categories/${category.slug}`}
                      className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                    >
                      <div className="text-sm font-medium leading-none">{category.name}</div>
                      {/* Description is not available in the API Category type, so it's removed. 
                          If you need it, you'll have to add it to your API response or handle it differently. */}
                      {/* <div className="line-clamp-2 text-xs leading-snug text-muted-foreground">
                        {category.description} 
                      </div> */}
                    </Link>
                  </NavigationMenuLink>
                  {category.subCategories && category.subCategories.length > 0 && (
                    <ul className="space-y-1 pl-3">
                      {category.subCategories.slice(0, 3).map((subcategory) => (
                        <li key={subcategory.slug}>
                          <NavigationMenuLink asChild>
                            <Link
                              to={`/categories/${category.slug}/${subcategory.slug}`}
                              className="block text-xs text-muted-foreground hover:text-foreground"
                            >
                              {subcategory.name}
                            </Link>
                          </NavigationMenuLink>
                        </li>
                      ))}
                      {category.subCategories.length > 3 && (
                        <li>
                          <NavigationMenuLink asChild>
                            <Link
                              to={`/categories/${category.slug}`}
                              className="block text-xs text-primary hover:underline"
                            >
                              View all
                            </Link>
                          </NavigationMenuLink>
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              ))}
            </div>
            {categories.length > 0 && (
              <div className="bg-muted/50 p-3">
                <Link
                  to="/categories"
                  className="flex w-full items-center justify-center rounded-md bg-primary p-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  View All Categories
                </Link>
              </div>
            )}
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}