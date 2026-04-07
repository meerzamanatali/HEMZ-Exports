"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Menu, X, Sun, Moon, User, LogOut, Settings, ShoppingBag, ChevronDown } from "lucide-react"
import { useTheme } from "next-themes"
import { CartIcon } from "@/components/cart/cart-icon"
import { MiniCart } from "@/components/cart/mini-cart"
import { useAuth } from "@/lib/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { user, isAuthenticated, isLoading, logout } = useAuth()
  const { toast } = useToast()

  const handleLogout = async () => {
    const userName = user?.first_name || "User"
    await logout()
    toast({
      title: "Logged out successfully",
      description: `Goodbye ${userName}! Your cart has been saved for your next visit.`,
    })
    router.push("/")
    router.refresh()
  }

  const navigation = [
    { name: "Home", href: "/" },
    { name: "Products", href: "/products" },
    { name: "Our Speciality", href: "/speciality" },
    { name: "About Us", href: "/about" },
    { name: "Contact", href: "/contact" },
  ]

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 animate-in slide-in-from-top duration-300">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative h-10 w-10 transition-transform duration-300 group-hover:scale-110">
                <Image
                  src="/hemz-pashmina-logo.png"
                  alt="HEMZ Pashmina Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-xl font-bold text-foreground transition-colors duration-300 group-hover:text-primary">
                  HEMZ
                </span>
                <span className="font-sans text-xs text-muted-foreground uppercase tracking-wider">Pashmina</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8" aria-label="Main navigation">
              {navigation.map((item, index) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-sm font-medium text-muted-foreground transition-all duration-300 hover:text-primary hover:scale-105 focus:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm px-1 py-1 relative group animate-in fade-in slide-in-from-top"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {item.name}
                  <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-primary scale-x-0 transition-transform duration-300 group-hover:scale-x-100"></span>
                </Link>
              ))}
            </nav>

            <div className="flex items-center space-x-2">
              {/* Auth Buttons / User Menu */}
              {!isLoading && (
                <>
                  {isAuthenticated && user ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hidden md:flex items-center gap-2 h-9 px-3 transition-all duration-300 hover:bg-primary/10"
                        >
                          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <span className="text-sm font-medium max-w-[100px] truncate">
                            {user.first_name || "Account"}
                          </span>
                          <ChevronDown className="h-3 w-3 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>
                          <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium">
                              {user.first_name} {user.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {user.email}
                            </p>
                          </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="cursor-pointer p-0">
                          <Link href="/account" className="flex items-center w-full px-2 py-1.5">
                            <User className="mr-2 h-4 w-4" />
                            My Account
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer p-0">
                          <Link href="/account?tab=orders" className="flex items-center w-full px-2 py-1.5">
                            <ShoppingBag className="mr-2 h-4 w-4" />
                            My Orders
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer p-0">
                          <Link href="/account?tab=security" className="flex items-center w-full px-2 py-1.5">
                            <Settings className="mr-2 h-4 w-4" />
                            Settings
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={handleLogout}
                          className="cursor-pointer text-destructive focus:text-destructive"
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Logout
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <Button size="sm" asChild className="hidden md:flex">
                      <Link href="/login">Login</Link>
                    </Button>
                  )}
                </>
              )}

              <CartIcon />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="h-9 w-9 px-0 transition-all duration-300 hover:scale-110 hover:bg-primary/10"
                aria-label="Toggle theme"
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all duration-500 dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all duration-500 dark:rotate-0 dark:scale-100" />
              </Button>

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden h-9 w-9 px-0 transition-all duration-300 hover:scale-110"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={isMenuOpen}
                aria-controls="mobile-menu"
              >
                {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {isMenuOpen && (
            <div className="md:hidden animate-in slide-in-from-top duration-300" id="mobile-menu">
              <nav className="px-2 pt-2 pb-3 space-y-1 border-t" aria-label="Mobile navigation">
                {navigation.map((item, index) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="block px-3 py-2 text-base font-medium text-muted-foreground hover:text-primary transition-all duration-300 hover:translate-x-2 hover:bg-primary/5 focus:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md animate-in fade-in slide-in-from-left"
                    style={{ animationDelay: `${index * 50}ms` }}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}

                {/* Mobile Auth Links */}
                <div className="border-t mt-2 pt-2">
                  {isAuthenticated && user ? (
                    <>
                      <div className="px-3 py-2 mb-2">
                        <p className="text-sm font-medium">{user.first_name} {user.last_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                      <Link
                        href="/account"
                        className="block px-3 py-2 text-base font-medium text-muted-foreground hover:text-primary transition-all duration-300 hover:translate-x-2 hover:bg-primary/5 rounded-md"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <User className="inline-block mr-2 h-4 w-4" />
                        My Account
                      </Link>
                      <button
                        onClick={() => {
                          handleLogout()
                          setIsMenuOpen(false)
                        }}
                        className="w-full text-left px-3 py-2 text-base font-medium text-destructive hover:bg-destructive/10 transition-all duration-300 rounded-md"
                      >
                        <LogOut className="inline-block mr-2 h-4 w-4" />
                        Logout
                      </button>
                    </>
                  ) : (
                    <div className="px-3 py-2">
                      <Button asChild className="w-full">
                        <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                          Login
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>
      <MiniCart />
    </>
  )
}
