"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router"
import { Menu, X, Search, User, ShoppingCart, LogOut } from "lucide-react"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "../components/ui/sheet"
import { ThemeToggle } from "../components/ui/ThemeToggle"
import { Avatar, AvatarFallback } from "../components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu"
import { useAuth } from "../contexts/AuthContext"
import { CategoriesDropdownDesktop, CategoriesDropdownMobile } from "../components/CategoriesDropdown"

export default function Navbar() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const { currentUser, isLoggedIn, logout, isAdmin, isCreator} = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/")
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 hidden md:flex">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            <span className="text-xl font-bold">Eventix</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link to="/" className="transition-colors hover:text-foreground/80">
              Home
            </Link>
            <Link to="/events" className="transition-colors hover:text-foreground/80">
              Events
            </Link>
            <div className="hidden md:block">
              <CategoriesDropdownDesktop />
            </div>
            {isLoggedIn && !isAdmin() && !isCreator() &&  (
              <Link to="/profile" className="transition-colors hover:text-foreground/80">
                My Tickets
              </Link>
            )}
            {isLoggedIn && (isAdmin() || isCreator()) && (
              <Link to="/admin" className="transition-colors hover:text-foreground/80">
                Admin
              </Link>
            )}
          </nav>
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="mr-2 md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="pr-0">
            <Link to="/" className="flex items-center">
              <span className="text-xl font-bold">Eventix</span>
            </Link>
            <div className="mt-8 flex w-full flex-col">
              <Link to="/" className="flex items-center py-2">
                Home
              </Link>
              <Link to="/events" className="flex items-center py-2">
                Events
              </Link>
              <div className="py-2">
                <CategoriesDropdownMobile />
              </div>
              {isLoggedIn ? (
                <>
                  {!isAdmin() && !isCreator && (
                    <Link to="/profile" className="flex items-center py-2">
                      My Tickets
                    </Link>
                  )}
                  {(isAdmin() || isCreator()) && (
                    <Link to="/admin" className="flex items-center py-2">
                      Dashboard
                    </Link>
                  )}
                  <button onClick={handleLogout} className="flex items-center py-2 text-left">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="flex items-center py-2">
                    Sign In
                  </Link>
                  <Link to="/signup" className="flex items-center py-2">
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>

        <Link to="/" className="mr-6 flex items-center space-x-2 md:hidden">
          <span className="text-xl font-bold">Eventix</span>
        </Link>

        <div className="flex flex-1 items-center justify-end space-x-2">
          {isSearchOpen ? (
            <div className="flex items-center">
              <Input type="search" placeholder="Search events..." className="mr-2 w-[150px] md:w-[250px]" />
              <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          ) : (
            <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(true)}>
              <Search className="h-5 w-5" />
              <span className="sr-only">Search</span>
            </Button>
          )}
          <ThemeToggle />

          {isLoggedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{currentUser?.fullName.charAt(0)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{currentUser?.fullName}</p>
                    <p className="text-xs text-muted-foreground">{currentUser?.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                {!isAdmin() && (
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer">
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      <span>My Tickets</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden items-center space-x-2 md:flex">
              <Button variant="ghost" asChild>
                <Link to="/login">Sign In</Link>
              </Button>
              <Button asChild>
                <Link to="/signup">Sign Up</Link>
              </Button>
            </div>
          )}

          <Link to="/checkout">
            <Button variant="ghost" size="icon">
              <ShoppingCart className="h-5 w-5" />
              <span className="sr-only">Cart</span>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
