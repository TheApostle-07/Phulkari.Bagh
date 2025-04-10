"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation"; // for redirection
// Import FontAwesome icons
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShoppingCart, faHeart } from "@fortawesome/free-solid-svg-icons";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";
// Import Firebase auth functions and the auth object
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { auth } from "./firebaseClient";
import styles from "./page.module.css";
import { toast } from "react-toastify";

// Define a type for a cart item.
interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

// Define a type for a product.
interface Product {
  _id: string;
  name: string;
  price: string; // assuming the price is stored as a string (e.g., "Rs 1000")
  desc?: string;
  colors?: string[];
  sizes?: string[];
  justIn?: boolean;
  defaultImage: {
    url: string;
  };
}

export default function Home() {
  const router = useRouter();
  // Products state initialized to an empty array of Product
  const [products, setProducts] = useState<Product[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("name-asc");
  const [filterJustIn, setFilterJustIn] = useState("");
  // Visible count for lazy loading
  const [visibleCount, setVisibleCount] = useState(10);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // New state for Firebase user and auth loading
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // State to track product loading
  const [productsLoading, setProductsLoading] = useState(true);

  // Fetch products on component mount
  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch("/api/products");
        if (!res.ok) {
          throw new Error("Failed to fetch products");
        }
        const data: Product[] = await res.json();
        setProducts(data);
      } catch (error) {
        console.error(error);
      } finally {
        setProductsLoading(false);
      }
    }
    fetchProducts();
  }, []);

  // Listen to Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // When authenticated, fetch the cart and calculate the total count
  useEffect(() => {
    if (user) {
      async function fetchCart() {
        try {
          const res = await fetch(`/api/cart?userId=${user.uid}`);
          if (!res.ok) {
            throw new Error("Failed to fetch cart");
          }
          const cartData = await res.json();
          if (cartData && Array.isArray(cartData.items)) {
            const items = cartData.items as CartItem[];
            const totalCount = items.reduce(
              (acc: number, item: CartItem) => acc + item.quantity,
              0
            );
            setCartCount(totalCount);
            setCartItems(items);
          } else {
            setCartCount(0);
            setCartItems([]);
          }
        } catch (error) {
          console.error(error);
        }
      }
      fetchCart();
    }
  }, [user]);

  // Reset visible count when filtered/sorted products change
  useEffect(() => {
    setVisibleCount(10);
  }, [searchTerm, sortOption, filterJustIn, products]);

  // Derived data: filtering and sorting
  const filteredProducts = useMemo(() => {
    return products.filter((p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (filterJustIn === ""
        ? true
        : filterJustIn === "justIn"
        ? p.justIn === true
        : p.justIn === false)
    );
  }, [products, searchTerm, filterJustIn]);

  const sortedProducts = useMemo(() => {
    const sorted = [...filteredProducts];
    if (sortOption === "name-asc") {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOption === "name-desc") {
      sorted.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortOption === "price-asc") {
      sorted.sort((a, b) => {
        const priceA = Number(a.price.replace(/[^\d]/g, ""));
        const priceB = Number(b.price.replace(/[^\d]/g, ""));
        return priceA - priceB;
      });
    } else if (sortOption === "price-desc") {
      sorted.sort((a, b) => {
        const priceA = Number(a.price.replace(/[^\d]/g, ""));
        const priceB = Number(b.price.replace(/[^\d]/g, ""));
        return priceB - priceA;
      });
    }
    return sorted;
  }, [filteredProducts, sortOption]);

  // Products to display based on lazy loading
  const visibleProducts = useMemo(() => {
    return sortedProducts.slice(0, visibleCount);
  }, [sortedProducts, visibleCount]);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < sortedProducts.length) {
          setVisibleCount((prev) => Math.min(prev + 10, sortedProducts.length));
        }
      },
      { threshold: 1 }
    );
    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }
    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
  }, [visibleCount, sortedProducts]);

  // --- Add to Cart Handler ---
  const handleAddToCart = async (product: Product) => {
    const priceNum = Number(product.price.replace(/[^\d]/g, ""));
    let updatedCartItems: CartItem[];

    const existingItem = cartItems.find(
      (item) => item.productId === product._id.toString()
    );

    if (existingItem) {
      updatedCartItems = cartItems.map((item) =>
        item.productId === product._id.toString()
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    } else {
      updatedCartItems = [
        ...cartItems,
        {
          productId: product._id.toString(),
          name: product.name,
          price: priceNum,
          quantity: 1,
        },
      ];
    }

    // Redirect non-authenticated users to sign in
    if (!user) {
      router.push("/signin");
      return;
    }

    // Update local states
    setCartItems(updatedCartItems);
    const newCartCount = updatedCartItems.reduce(
      (acc, item) => acc + item.quantity,
      0
    );
    setCartCount(newCartCount);

    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          items: updatedCartItems,
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to update cart on the server");
      }
      // Show a professional toast message
      toast.success("Item added to Cart", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } catch (error: unknown) {
      console.error("Error updating the cart:", error);
      toast.error("Error updating your cart. Please try again.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };

  // WhatsApp enquiry functions.
  const getWhatsAppMessage = (product: Product): string => {
    return `I'm interested in ${product.name} priced at Rs ${product.price}. Please send me more details.`;
  };

  const handleWhatsAppEnquiry = (product: Product) => {
    const message = encodeURIComponent(getWhatsAppMessage(product));
    window.open(
      `https://api.whatsapp.com/send?phone=+919510394742&text=${message}`,
      "_blank"
    );
  };

  return (
    <main className={styles.main}>
      {/* Header with flex layout */}
      <nav className={styles.nav}>
        <div className={styles.leftSection}>
          <div className={styles.logo}>Phulkari Bagh</div>
        </div>
        <div className={styles.rightSection}>
          {authLoading ? (
            <div className={styles.loader}></div>
          ) : user ? (
            <>
              <Link href="/cart" className={styles.cartLink}>
                <FontAwesomeIcon icon={faShoppingCart} />
                {cartCount > 0 && (
                  <span className={styles.badge}>{cartCount}</span>
                )}
              </Link>
              <UserDropdown user={user} onLogout={() => signOut(auth)} />
            </>
          ) : (
            <div className={styles.authContainer}>
              <Link href="/signin" className={styles.authLink}>
                Sign In / Sign Up
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section id="hero" className={styles.hero}>
        <div className={styles.heroContent}>
          <h1>Experience Phulkari</h1>
          <p>
            Embrace the vibrant colors, intricate designs, and cultural richness of traditional Phulkari craftsmanship.
          </p>
          <button
            className={styles.heroButton}
            onClick={() => {
              const shopSection = document.getElementById("shop");
              if (shopSection) {
                shopSection.scrollIntoView({ behavior: "smooth" });
              }
            }}
          >
            Shop Now
          </button>
        </div>
      </section>

      {/* Controls: Search, Sort, Filter */}
      <section className={styles.controls}>
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
        <select
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
          className={styles.selectInput}
        >
          <option value="name-asc">Name (A-Z)</option>
          <option value="name-desc">Name (Z-A)</option>
          <option value="price-asc">Price (Low to High)</option>
          <option value="price-desc">Price (High to Low)</option>
        </select>
        <select
          value={filterJustIn}
          onChange={(e) => setFilterJustIn(e.target.value)}
          className={styles.selectInput}
        >
          <option value="">All Products</option>
          <option value="justIn">Just In</option>
          <option value="notJustIn">Not Just In</option>
        </select>
      </section>

      {/* Products Section with Loader */}
      <section id="shop" className={styles.featuredProducts}>
        <h2>Featured Collections</h2>
        {productsLoading ? (
          <div className={styles.productsLoader}>
            <div className={styles.spinner}></div>
          </div>
        ) : (
          <div className={styles.productList}>
            {visibleProducts.map((product) => (
              <div key={product._id} className={styles.productItem}>
                <div className={styles.productTopBar}>
                  <button className={styles.wishlistBtn} aria-label="Add to Wishlist">
                    <FontAwesomeIcon icon={faHeart} />
                  </button>
                  {product.justIn && (
                    <div className={styles.justInLabel}>Just In</div>
                  )}
                </div>
                <div className={styles.productImage}>
                  <Image
                    src={product.defaultImage.url}
                    alt={product.name}
                    fill
                    style={{ objectFit: "contain" }}
                    sizes="(max-width: 768px) 100vw, 400px"
                    className={styles.productImg}
                  />
                </div>
                <div className={styles.productInfo}>
                  <h3>{product.name}</h3>
                  <p>{product.desc}</p>
                  <div className={styles.price}>Rs {product.price}</div>
                  {product.colors && (
                    <div className={styles.colorRow}>
                      {product.colors.map((color: string, idx: number) => (
                        <span
                          key={idx}
                          className={styles.swatch}
                          style={{ backgroundColor: color }}
                        ></span>
                      ))}
                    </div>
                  )}
                  {product.sizes && product.sizes.length > 0 && (
                    <div className={styles.sizeRow}>
                      {product.sizes.map((size: string, idx: number) => (
                        <button key={idx} className={styles.sizeOption}>
                          {size}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className={styles.actionRow}>
                    <button onClick={() => handleAddToCart(product)} className={styles.actionButton}>
                      <FontAwesomeIcon icon={faShoppingCart} className={styles.cartIcon} /> Add to Cart
                    </button>
                    <button onClick={() => handleWhatsAppEnquiry(product)} className={styles.whatsappButton}>
                      <FontAwesomeIcon icon={faWhatsapp} className={styles.whatsappIcon} /> WhatsApp Enquiry
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {/* Lazy Loading Sentinel */}
        <div ref={loadMoreRef} className={styles.loadMore}></div>
      </section>

      {/* About Section */}
      <section id="about" className={styles.aboutUs}>
        <h2>Our Story</h2>
        <p>
          Phulkari Bagh celebrates the age-old craft of Phulkari—literally meaning “flower work.” Each piece is lovingly created with meticulous attention to detail, reflecting a tradition passed down for generations. Our mission is to bring this radiant heritage to you by blending traditional artistry with modern aesthetics.
        </p>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>&copy; {new Date().getFullYear()} Phulkari Bagh. All rights reserved.</p>
        <p>
          <a href="#">Privacy Policy</a> | <a href="#">Terms &amp; Conditions</a>
        </p>
      </footer>
    </main>
  );
}

// ---------------- UserDropdown Component ----------------
type UserDropdownProps = {
  user: User;
  onLogout: () => void;
};

function UserDropdown({ user, onLogout }: UserDropdownProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

  // Helper to get user initials
  const getInitials = (user: User) => {
    if (user.displayName) {
      const names = user.displayName.split(" ");
      if (names.length === 1) return names[0].charAt(0).toUpperCase();
      return (
        names[0].charAt(0).toUpperCase() +
        names[names.length - 1].charAt(0).toUpperCase()
      );
    } else if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return "";
  };

  return (
    <div className={styles.userDropdown}>
      <div className={styles.userAvatar} onClick={toggleMenu}>
        {getInitials(user)}
      </div>
      {menuOpen && (
        <div className={styles.dropdownMenu}>
          <div
            className={styles.dropdownItem}
            onClick={() => {
              setMenuOpen(false);
              onLogout();
            }}
          >
            Logout
          </div>
        </div>
      )}
      <style jsx>{`
        .${styles.userDropdown} {
          position: relative;
          cursor: pointer;
        }
        .${styles.userAvatar} {
          width: 40px;
          height: 40px;
          background-color: #4285f4;
          color: #fff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          font-weight: bold;
        }
        .${styles.dropdownMenu} {
          position: absolute;
          top: 45px;
          right: 0;
          background: #fff;
          border: 1px solid #ddd;
          border-radius: 4px;
          box-shadow: 0px 2px 6px rgba(0, 0, 0, 0.2);
          min-width: 150px;
          z-index: 10;
        }
        .${styles.dropdownItem} {
          padding: 10px 15px;
          font-size: 0.95rem;
          cursor: pointer;
          color: #333;
          text-decoration: none;
          display: block;
          transition: background 0.2s ease;
        }
        .${styles.dropdownItem}:hover {
          background: #f7f7f7;
        }
        .${styles.badge} {
          background: #e91e63;
          color: #fff;
          border-radius: 50%;
          padding: 2px 6px;
          font-size: 0.8rem;
          margin-left: 5px;
        }
      `}</style>
    </div>
  );
}
