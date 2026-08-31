import { useState } from "react";
import { Link, NavLink } from "react-router";
import {
  Search,
  Heart,
  User,
  ShoppingBag,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Store,
  LayoutDashboard,
  Clock,
  Loader2,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { useSellerMe } from "@/hooks/use-auth";
import { BecomeSellerDialog } from "@/components/seller/become-seller-dialog";
import { useCartStore } from "@/stores/cart";
import { useWishlistStore } from "@/stores/wishlist";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { WishlistDrawer } from "@/components/wishlist/WishlistDrawer";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/new-arrivals", label: "New Arrivals" },
  { to: "/best-sellers", label: "Best Sellers" },
  { to: "/about", label: "About" },
  { to: "/blog", label: "Blog" },
  { to: "/contact", label: "Contact" },
];

const categories = [
  "Fashion",
  "Electronics",
  "Beauty",
  "Fitness",
  "Home Decor",
  "Accessories",
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const { data: session } = authClient.useSession();
  const cartCount = useCartStore((s) => s.items.length);
  const wishlistCount = useWishlistStore((s) => s.items.length);

  const user = session?.user;
  const isLoggedIn = !!user;
  const isSeller = user?.role === "seller";
  const isAdmin = user?.role === "admin";
  const { data: sellerData, isLoading: sellerLoading } = useSellerMe();
  const seller = isSeller ? sellerData?.seller : null;

  const handleSignOut = async () => {
    await authClient.signOut();
    setUserMenuOpen(false);
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-50 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-1">
          <span className="text-xl font-bold tracking-tight text-foreground">
            Nova
          </span>
          <span className="text-xl font-bold tracking-tight text-primary">
            Trend
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  "relative px-3 py-2 text-sm font-medium transition-colors hover:text-foreground",
                  isActive ? "text-foreground" : "text-muted-foreground",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {link.label}
                  {link.to === "/shop" && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setCategoriesOpen((v) => !v);
                      }}
                      className="ml-0.5 inline-flex items-center"
                      tabIndex={-1}
                    >
                      <ChevronDown className="size-3.5" />
                    </button>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-foreground" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Desktop Icons */}
        <div className="hidden items-center gap-1 lg:flex">
          <Button variant="ghost" size="icon-sm" aria-label="Search">
            <Search className="size-4.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Wishlist"
            onClick={() => setWishlistOpen(true)}
            className="relative"
          >
            <Heart
              className={cn(
                "size-4.5",
                wishlistCount > 0 && "fill-primary text-primary",
              )}
            />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                {wishlistCount}
              </span>
            )}
          </Button>

          {/* User / Login */}
          {isLoggedIn ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted"
              >
                {user.image ? (
                  <img
                    src={user.image}
                    alt={user.name || "User"}
                    className="size-8 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                    {user.name?.charAt(0).toUpperCase() || "U"}
                  </span>
                )}
              </button>

              {/* User Dropdown */}
              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-xl border border-border bg-white shadow-lg">
                    <div className="border-b border-border px-4 py-3">
                      <p className="text-sm font-medium text-foreground truncate">
                        {user.name || "User"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                    <div className="py-1">
                      <Link
                        to="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <User className="size-4" />
                        Profile
                      </Link>
                      {user.role === "buyer" && (
                        <BecomeSellerDialog
                          onSellerCreated={() => {
                            setUserMenuOpen(false);
                            window.location.reload();
                          }}
                        >
                          <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer">
                            <Store className="size-4" />
                            Become a Seller
                          </div>
                        </BecomeSellerDialog>
                      )}
                      {isSeller && (
                        <>
                          {sellerLoading ? (
                            <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground">
                              <Loader2 className="size-4 animate-spin" />
                              Loading...
                            </div>
                          ) : seller?.approved ? (
                            <Link
                              to="/seller"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            >
                              <LayoutDashboard className="size-4" />
                              Seller Dashboard
                            </Link>
                          ) : seller?.revokedAt ? (
                            <Link
                              to="/seller"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2 px-4 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            >
                              <XCircle className="size-4" />
                              <span>Seller account revoked</span>
                            </Link>
                          ) : (
                            <div className="flex items-center gap-2 px-4 py-2 text-xs text-muted-foreground">
                              <Clock className="size-4" />
                              <span>Seller account pending approval</span>
                            </div>
                          )}
                        </>
                      )}
                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          <ShieldCheck className="size-4" />
                          Admin Dashboard
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <LogOut className="size-4" />
                        Sign out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link to="/login">
              <Button variant="ghost" size="sm">
                <User className="size-4" />
                Login
              </Button>
            </Link>
          )}

          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Cart"
            onClick={() => setCartOpen(true)}
            className="relative"
          >
            <span className="relative">
              <ShoppingBag className="size-4.5" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-2 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                  {cartCount}
                </span>
              )}
            </span>
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon-sm"
          className="lg:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>
      </div>

      {/* Categories Dropdown */}
      {categoriesOpen && (
        <div className="hidden border-t border-border bg-white lg:block">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex gap-6 py-4">
              {categories.map((cat) => (
                <Link
                  key={cat}
                  to={`/shop?category=${cat.toLowerCase().replace(" ", "-")}`}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  onClick={() => setCategoriesOpen(false)}
                >
                  {cat}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="fixed inset-x-0 top-16 z-50 border-t border-border bg-white lg:hidden">
          <nav className="flex flex-col p-4">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "border-b border-border px-3 py-3 text-sm font-medium transition-colors last:border-b-0 hover:text-foreground",
                    isActive ? "text-foreground" : "text-muted-foreground",
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
            <div className="mt-4 flex items-center gap-4 border-t border-border pt-4">
              {isLoggedIn ? (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                  >
                    {user?.image ? (
                      <img
                        src={user.image}
                        alt={user.name || "User"}
                        className="size-6 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                        {user?.name?.charAt(0).toUpperCase() || "U"}
                      </span>
                    )}
                    {user?.name || "Profile"}
                  </Link>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <LogOut className="size-4" />
                    Sign out
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  <User className="size-4" />
                  Login
                </Link>
              )}
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  setWishlistOpen(true);
                }}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <Heart
                  className={cn(
                    "size-4",
                    wishlistCount > 0 && "fill-primary text-primary",
                  )}
                />
                Wishlist {wishlistCount > 0 && `(${wishlistCount})`}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  setCartOpen(true);
                }}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <ShoppingBag className="size-4" />
                Cart {cartCount > 0 && `(${cartCount})`}
              </button>
            </div>
          </nav>
        </div>
      )}
      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
      <WishlistDrawer open={wishlistOpen} onOpenChange={setWishlistOpen} />
    </header>
  );
}
