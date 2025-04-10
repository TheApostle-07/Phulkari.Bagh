"use client";

import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
  memo,
} from "react";
import Link from "next/link";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEdit,
  faTrashAlt,
  faToggleOn,
  faToggleOff,
  faPlus,
  faSearch,
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import styles from "./Dashboard.module.css";

// Product type definition.
export interface Product {
  _id: string;
  name: string;
  desc: string;
  price: string;
  published?: boolean;
  defaultImage?: { url: string; publicId: string };
  colors?: string[];
  sizes?: string[];
  badge?: string;
}

interface DashboardProps {
  products: Product[];
}

export default function Dashboard({ products: initialProducts }: DashboardProps) {
  // Global states.
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Modal state for adding/editing a product.
  const [modalOpen, setModalOpen] = useState(false);
  const [formValues, setFormValues] = useState({
    name: "",
    desc: "",
    price: "",
    images: [] as File[],
    colors: [] as string[],
    sizes: [] as string[],
    badge: "",
    published: false,
    colorImages: {} as { [color: string]: File[] },
  });
  const [modalError, setModalError] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewSelectedColor, setPreviewSelectedColor] = useState<string | null>(null);

  // New state: enable swatches (optional feature)
  const [swatchesEnabled, setSwatchesEnabled] = useState(false);

  // Offline detection state.
  const [isOffline, setIsOffline] = useState(false);
  const offlineToastDisplayed = useRef(false);

  // State for current color (for adding a new swatch).
  const [currentColor, setCurrentColor] = useState<string>("#000000");
  // State for tracking which swatch is active.
  const [activeSwatch, setActiveSwatch] = useState<string | null>(null);

  // --- Offline Detection ---
  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);
      if (!offlineToastDisplayed.current) {
        toast.warn("You appear to be offline. Some functionalities may be limited.", {
          toastId: "offline-warning",
          autoClose: 3000,
        });
        offlineToastDisplayed.current = true;
      }
    };
    const handleOnline = () => {
      setIsOffline(false);
      toast.dismiss("offline-warning");
      offlineToastDisplayed.current = false;
      if (!toast.isActive("online-success")) {
        toast.success("You are back online!", {
          toastId: "online-success",
          autoClose: 3000,
        });
      }
    };
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  // --- Filtering & Pagination ---
  const filteredProducts = useMemo(() =>
    products.filter((p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    ), [products, searchTerm]
  );
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage]);

  // --- Handlers ---
  const openModal = useCallback(() => setModalOpen(true), []);
  const closeModal = useCallback(() => {
    setModalOpen(false);
    setModalError("");
    setFormValues({
      name: "",
      desc: "",
      price: "",
      images: [],
      colors: [],
      sizes: [],
      badge: "",
      published: false,
      colorImages: {},
    });
    setPreviewData(null);
    setPreviewModalOpen(false);
    setPreviewSelectedColor(null);
    setActiveSwatch(null);
  }, []);

  const handleFieldChange = useCallback((field: string, value: any) => {
    if (field === "name" && value.length > 50) {
      setModalError("Product name cannot exceed 50 characters.");
      return;
    }
    if (field === "desc" && value.length > 200) {
      setModalError("Product description cannot exceed 200 characters.");
      return;
    }
    setModalError("");
    setFormValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setFormValues((prev) => ({ ...prev, images: files }));
    }
  }, []);

  const handleSwatchFileChange = useCallback((color: string, slot: number, file: File) => {
    setFormValues((prev) => {
      const currentFiles = prev.colorImages[color] || [];
      const updatedFiles = [...currentFiles];
      updatedFiles[slot] = file;
      return {
        ...prev,
        colorImages: { ...prev.colorImages, [color]: updatedFiles },
      };
    });
  }, []);

  const generateImagePreviews = useCallback((files: File[]) => {
    return Promise.all(files.map(
      (file) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        })
    ));
  }, []);

  const handlePreview = useCallback(async () => {
    if (!formValues.name || !formValues.desc || !formValues.price) {
      setModalError("Please fill out Product Name, Description, and Price.");
      if (!toast.isActive("preview-missing"))
        toast.error("Missing required fields for preview.", { toastId: "preview-missing", autoClose: 3000 });
      return;
    }
    if (formValues.images.length === 0) {
      setModalError("Please upload at least one global image.");
      if (!toast.isActive("global-image-missing"))
        toast.error("Please upload a global image.", { toastId: "global-image-missing", autoClose: 3000 });
      return;
    }
    try {
      const globalPreviews = await generateImagePreviews(formValues.images);
      const colorPreviews: { [color: string]: string[] } = {};
      for (const color of formValues.colors) {
        const files = formValues.colorImages[color] || [];
        if (files.length > 0) {
          colorPreviews[color] = await generateImagePreviews(files);
        }
      }
      setPreviewSelectedColor(formValues.colors.length > 0 ? formValues.colors[0] : null);
      setPreviewData({ ...formValues, globalPreviews, colorPreviews });
      setPreviewModalOpen(true);
      setModalError("");
    } catch (err: any) {
      setModalError("Failed to generate previews");
      if (!toast.isActive("preview-failed"))
        toast.error("Failed to generate image previews.", { toastId: "preview-failed", autoClose: 3000 });
    }
  }, [formValues, generateImagePreviews]);

  const addCurrentColor = useCallback(() => {
    if (formValues.colors.length >= 5) {
      setModalError("You can add a maximum of 5 color swatches.");
      if (!toast.isActive("max-colors"))
        toast.warn("Maximum of 5 color swatches allowed.", { toastId: "max-colors", autoClose: 3000 });
      return;
    }
    if (!formValues.colors.includes(currentColor)) {
      setFormValues((prev) => ({
        ...prev,
        colors: [...prev.colors, currentColor],
        colorImages: { ...prev.colorImages, [currentColor]: [] },
      }));
      setModalError("");
      if (!toast.isActive("color-added"))
        toast.success("Color added successfully.", { toastId: "color-added", autoClose: 3000 });
    }
  }, [formValues.colors, currentColor]);

  const handleDelete = useCallback(async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await fetch(`/api/products/${productId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete the product");
      setProducts((prev) => prev.filter((p) => p._id !== productId));
      if (!toast.isActive("delete-" + productId))
        toast.success("Product deleted successfully.", { toastId: "delete-" + productId, autoClose: 3000 });
    } catch (error: any) {
      if (!toast.isActive("delete-error-" + productId))
        toast.error(error.message || "Error deleting product.", { toastId: "delete-error-" + productId, autoClose: 3000 });
    }
  }, []);

  const handleToggle = useCallback(async (product: Product) => {
    try {
      const updatedProduct = { ...product, published: !product.published };
      const res = await fetch(`/api/products/${product._id}/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: updatedProduct.published }),
      });
      if (!res.ok) throw new Error("Failed to update the product status");
      setProducts((prev) =>
        prev.map((p) => (p._id === product._id ? updatedProduct : p))
      );
      if (!toast.isActive("toggle-" + product._id))
        toast.success(
          `Product ${updatedProduct.published ? "published" : "unpublished"} successfully.`,
          { toastId: "toggle-" + product._id, autoClose: 3000 }
        );
    } catch (error: any) {
      if (!toast.isActive("toggle-error-" + product._id))
        toast.error(error.message || "Error updating product status.", { toastId: "toggle-error-" + product._id, autoClose: 3000 });
    }
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValues.name || !formValues.desc || !formValues.price) {
      setModalError("Please fill out Product Name, Description, and Price.");
      if (!toast.isActive("submit-required"))
        toast.error("Required fields are missing.", { toastId: "submit-required", autoClose: 3000 });
      return;
    }
    if (formValues.images.length === 0) {
      setModalError("Please upload at least one global image.");
      if (!toast.isActive("submit-global-image"))
        toast.error("At least one global image is required.", { toastId: "submit-global-image", autoClose: 3000 });
      return;
    }
    setModalError("");
    setModalLoading(true);
    try {
      const fileToBase64 = (file: File) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () =>
            resolve((reader.result as string).replace(/^data:image\/\w+;base64,/, ""));
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      const uploadedGlobalImages: { url: string; publicId: string }[] = [];
      for (const file of formValues.images) {
        const base64 = await fileToBase64(file);
        const res = await fetch("/api/products/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64, folder: "phulkari_products" }),
        });
        if (!res.ok) throw new Error("Global image upload failed");
        const data = await res.json();
        uploadedGlobalImages.push({ url: data.secure_url, publicId: data.public_id });
      }
      const uploadedColorImages: { [color: string]: { url: string; publicId: string }[] } = {};
      for (const color of formValues.colors) {
        const files = formValues.colorImages[color] || [];
        uploadedColorImages[color] = [];
        for (const file of files) {
          const base64 = await fileToBase64(file);
          const res = await fetch("/api/products/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageBase64: base64, folder: "phulkari_products" }),
          });
          if (!res.ok) throw new Error("Color image upload failed");
          const data = await res.json();
          uploadedColorImages[color].push({ url: data.secure_url, publicId: data.public_id });
        }
      }
      const payload = {
        name: formValues.name,
        desc: formValues.desc,
        price: formValues.price,
        defaultImage:
          uploadedGlobalImages[0] ||
          (formValues.colors.length > 0 &&
            uploadedColorImages[formValues.colors[0]] &&
            uploadedColorImages[formValues.colors[0]][0]) ||
          null,
        imagesByColor: uploadedColorImages,
        colors: formValues.colors,
        sizes: formValues.sizes,
        badge: formValues.badge,
        published: formValues.published,
      };
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create product");
      const newProduct = await res.json();
      setProducts((prev) => [newProduct, ...prev]);
      closeModal();
      if (!toast.isActive("create-success"))
        toast.success("Product created successfully!", { toastId: "create-success", autoClose: 3000 });
    } catch (err: any) {
      setModalError(err.message || "Something went wrong");
      if (!toast.isActive("create-error"))
        toast.error(err.message || "Error creating product.", { toastId: "create-error", autoClose: 3000 });
    } finally {
      setModalLoading(false);
    }
  }, [formValues, closeModal]);

  // --- Memoized Helper Components ---
  const HeaderComp = memo(function HeaderComp() {
    return (
      <header className={styles.header}>
        <div className={styles.logo}>Phulkari Bagh</div>
        <nav className={styles.navLinks}>
          <Link href="/">Home</Link>
          <Link href="/shop">Shop</Link>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
        </nav>
      </header>
    );
  });

  const FooterComp = memo(function FooterComp() {
    return (
      <footer className={styles.footer}>
        <p>&copy; {new Date().getFullYear()} House of Phulkari. All rights reserved.</p>
        <div className={styles.footerLinks}>
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms & Conditions</Link>
        </div>
      </footer>
    );
  });

  const ModalComp = memo(function ModalComp({
    children,
    onClose,
  }: {
    children: React.ReactNode;
    onClose: () => void;
  }) {
    return (
      <div className={styles.modalOverlay}>
        <div className={styles.modal}>
          <button className={styles.closeButton} onClick={onClose}>
            &times;
          </button>
          {children}
        </div>
      </div>
    );
  });

  const OfflineModalComp = memo(function OfflineModalComp({
    onRetry,
  }: {
    onRetry: () => void;
  }) {
    return (
      <div className={styles.offlineModalOverlay}>
        <div className={styles.offlineModal}>
          <h2>You seem to be offline</h2>
          <p>Please check your internet connection.</p>
          <button className={styles.retryButton} onClick={onRetry}>
            Retry
          </button>
        </div>
      </div>
    );
  });

  const ColorPickerComp = memo(function ColorPickerComp({
    currentColor,
    onCurrentColorChange,
    onAddColor,
  }: {
    currentColor: string;
    onCurrentColorChange: (val: string) => void;
    onAddColor: () => void;
  }) {
    return (
      <div className={styles.colorPickerSection}>
        <input
          type="color"
          value={currentColor}
          onChange={(e) => onCurrentColorChange(e.target.value)}
          className={styles.colorPicker}
        />
        <button type="button" onClick={onAddColor} className={styles.addColorButton}>
          <FontAwesomeIcon icon={faPlus} /> Add Color
        </button>
      </div>
    );
  });

  const RenderColorSwatchesComp = memo(function RenderColorSwatchesComp({
    colors,
    activeSwatch,
    onSwatchClick,
    onColorImageChange,
  }: {
    colors: string[];
    activeSwatch: string | null;
    onSwatchClick: (color: string) => void;
    onColorImageChange: (color: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  }) {
    return (
      <div className={styles.selectedColorsContainer}>
        {colors.map((color) => (
          <div key={color} className={styles.selectedColor}>
            <div
              className={styles.colorSwatch}
              style={{ backgroundColor: color }}
              title="Selected color"
              onClick={() => onSwatchClick(color)}
            />
            <label className={styles.swatchLabel}>{color}</label>
            {activeSwatch === color && (
              <div className={styles.swatchUploads}>
                {[0, 1, 2].map((slot) => (
                  <div key={slot} className={styles.swatchUpload}>
                    <input
                      type="file"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0])
                          onColorImageChange(color, e);
                      }}
                      className={styles.swatchFileInput}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  });

  const SizeChipsComp = memo(function SizeChipsComp({
    selectedSizes,
    onToggleSize,
  }: {
    selectedSizes: string[];
    onToggleSize: (size: string) => void;
  }) {
    const availableSizes = ["XS", "S", "M", "L", "XL", "XXL"];
    return (
      <div className={styles.sizeChipsContainer}>
        {availableSizes.map((size) => (
          <button
            key={size}
            type="button"
            onClick={() => onToggleSize(size)}
            className={`${styles.sizeChip} ${
              selectedSizes.includes(size) ? styles.sizeChipSelected : ""
            }`}
          >
            {size}
          </button>
        ))}
      </div>
    );
  });

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFieldChange("name", e.target.value);
    },
    [handleFieldChange]
  );
  const handleDescChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      handleFieldChange("desc", e.target.value);
    },
    [handleFieldChange]
  );
  const handlePriceChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFieldChange("price", e.target.value);
    },
    [handleFieldChange]
  );

  const handleColorImageChange = (color: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const existing = formValues.colorImages[color] || [];
      if (existing.length + files.length > 3) {
        setModalError("You can only upload up to 3 images per color swatch.");
        if (!toast.isActive("color-max-" + color)) {
          toast.error("Max of 3 images allowed per color.", { toastId: "color-max-" + color, autoClose: 3000 });
        }
        return;
      }
      setModalError("");
      setFormValues((prev) => ({
        ...prev,
        colorImages: {
          ...prev.colorImages,
          [color]: [...existing, ...files],
        },
      }));
    }
  };

  return (
    <div className={styles.dashboardContainer}>
      <HeaderComp />
      <main className={styles.mainContent}>
        <div className={styles.topBar}>
          <div className={styles.searchWrapper}>
            <FontAwesomeIcon icon={faSearch} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className={styles.searchInput}
            />
          </div>
          <button onClick={openModal} className={styles.addButton}>
            <FontAwesomeIcon icon={faPlus} /> Add New Product
          </button>
        </div>
        {paginatedProducts.length === 0 ? (
          <p className={styles.noProducts}>No products found.</p>
        ) : (
          <ul className={styles.productList}>
            {paginatedProducts.map((product) => (
              <li key={product._id} className={styles.productItem}>
                <div className={styles.productRow}>
                  <div className={styles.productImageContainer}>
                    <Image
                      src={product.defaultImage?.url || "/placeholder.png"}
                      alt={product.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 400px"
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                  <div className={styles.productDetails}>
                    <h2 className={styles.productName}>{product.name}</h2>
                    <p className={styles.productDesc}>{product.desc}</p>
                    <p className={styles.productPrice}>Price: {product.price}</p>
                    {product.sizes && product.sizes.length > 0 && (
                      <div className={styles.sizesContainer}>
                        {product.sizes.map((size: any, idx: number) => (
                          <span key={idx} className={styles.sizeChip}>
                            {typeof size === "object"
                              ? `${size.label} (${size.badge})`
                              : size}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className={styles.actionButtons}>
                    <Link href={`/admin/products/${product._id}/edit`}>
                      <button title="Edit" className={styles.iconButton}>
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                    </Link>
                    <button
                      onClick={() => handleDelete(product._id)}
                      className={styles.iconButton}
                      title="Delete"
                    >
                      <FontAwesomeIcon icon={faTrashAlt} />
                    </button>
                    <button
                      onClick={() => handleToggle(product)}
                      className={styles.toggleButton}
                      title={product.published ? "Unpublish" : "Publish"}
                    >
                      <FontAwesomeIcon icon={product.published ? faToggleOn : faToggleOff} />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className={styles.pagination}>
          <button
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className={styles.pageButton}
          >
            Prev
          </button>
          <span>
            Page {currentPage} of {Math.max(totalPages, 1)}
          </span>
          <button
            disabled={currentPage >= totalPages || totalPages === 0}
            onClick={() => setCurrentPage((p) => p + 1)}
            className={styles.pageButton}
          >
            Next
          </button>
        </div>
      </main>
      <FooterComp />
      {modalOpen && (
        <ModalComp onClose={closeModal}>
          <h2>Add New Product</h2>
          {modalError && <p className={styles.modalError}>{modalError}</p>}
          <form onSubmit={handleSubmit} className={styles.modalForm}>
            <label className={styles.modalLabel}>Product Name:</label>
            <input
              type="text"
              value={formValues.name}
              onChange={handleNameChange}
              className={styles.modalInput}
              required
            />
            <label className={styles.modalLabel}>Description:</label>
            <textarea
              value={formValues.desc}
              onChange={handleDescChange}
              className={styles.modalTextarea}
              required
            />
            <label className={styles.modalLabel}>Price (INR):</label>
            <input
              type="text"
              value={formValues.price}
              onChange={handlePriceChange}
              className={styles.modalInput}
              required
            />
            <label className={styles.modalLabel}>
              Upload Global Images (optional):
            </label>
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className={styles.modalInput}
            />
            <div className={styles.swatchToggleWrapper}>
              <label className={styles.swatchToggleLabel}>
                <input
                  type="checkbox"
                  checked={swatchesEnabled}
                  onChange={(e) => setSwatchesEnabled(e.target.checked)}
                />{" "}
                Enable Color Swatches
              </label>
            </div>
            {swatchesEnabled && (
              <>
                <label className={styles.modalLabel}>Select Colors (max 5):</label>
                <ColorPickerComp
                  currentColor={currentColor}
                  onCurrentColorChange={setCurrentColor}
                  onAddColor={addCurrentColor}
                />
                {formValues.colors.length > 0 && (
                  <RenderColorSwatchesComp
                    colors={formValues.colors}
                    activeSwatch={activeSwatch}
                    onSwatchClick={(color) =>
                      setActiveSwatch((prev) => (prev === color ? null : color))
                    }
                    onColorImageChange={handleColorImageChange}
                  />
                )}
              </>
            )}
            <label className={styles.modalLabel}>Select Sizes:</label>
            <SizeChipsComp
              selectedSizes={formValues.sizes}
              onToggleSize={(size) => {
                if (formValues.sizes.includes(size)) {
                  handleFieldChange(
                    "sizes",
                    formValues.sizes.filter((s) => s !== size)
                  );
                } else {
                  handleFieldChange("sizes", [...formValues.sizes, size]);
                }
              }}
            />
            <label className={styles.modalLabel}>
              Overall Badge (optional):
            </label>
            <input
              type="text"
              value={formValues.badge}
              onChange={(e) => handleFieldChange("badge", e.target.value)}
              className={styles.modalInput}
            />
            <label className={styles.modalLabel}>
              Published:{" "}
              <input
                type="checkbox"
                checked={formValues.published}
                onChange={(e) => handleFieldChange("published", e.target.checked)}
              />
            </label>
            <div className={styles.modalButtonRow}>
              <button
                type="submit"
                disabled={modalLoading}
                className={styles.submitButton}
                style={{ opacity: modalLoading ? 0.7 : 1 }}
              >
                {modalLoading ? (
                  <>
                    <span className={styles.spinnerSmall}></span> Saving...
                  </>
                ) : (
                  "Publish"
                )}
              </button>
              <button
                type="button"
                onClick={closeModal}
                className={styles.cancelButton}
              >
                Cancel
              </button>
            </div>
          </form>
        </ModalComp>
      )}
      {isOffline && <OfflineModalComp onRetry={() => window.location.reload()} />}
    </div>
  );
}

//////////////////////////////////////////////
// External Memoized Helper Components
//////////////////////////////////////////////

const HeaderComp = memo(function HeaderComp() {
  return (
    <header className={styles.header}>
      <div className={styles.logo}>House of Phulkari</div>
      <nav className={styles.navLinks}>
        <Link href="/">Home</Link>
        <Link href="/shop">Shop</Link>
        <Link href="/about">About</Link>
        <Link href="/contact">Contact</Link>
      </nav>
    </header>
  );
});

const FooterComp = memo(function FooterComp() {
  return (
    <footer className={styles.footer}>
      <p>&copy; {new Date().getFullYear()} House of Phulkari. All rights reserved.</p>
      <div className={styles.footerLinks}>
        <Link href="/privacy">Privacy Policy</Link>
        <Link href="/terms">Terms & Conditions</Link>
      </div>
    </footer>
  );
});

const ModalComp = memo(function ModalComp({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <button className={styles.closeButton} onClick={onClose}>
          &times;
        </button>
        {children}
      </div>
    </div>
  );
});

const OfflineModalComp = memo(function OfflineModalComp({
  onRetry,
}: {
  onRetry: () => void;
}) {
  return (
    <div className={styles.offlineModalOverlay}>
      <div className={styles.offlineModal}>
        <h2>You seem to be offline</h2>
        <p>Please check your internet connection.</p>
        <button className={styles.retryButton} onClick={onRetry}>
          Retry
        </button>
      </div>
    </div>
  );
});

const ColorPickerComp = memo(function ColorPickerComp({
  currentColor,
  onCurrentColorChange,
  onAddColor,
}: {
  currentColor: string;
  onCurrentColorChange: (val: string) => void;
  onAddColor: () => void;
}) {
  return (
    <div className={styles.colorPickerSection}>
      <input
        type="color"
        value={currentColor}
        onChange={(e) => onCurrentColorChange(e.target.value)}
        className={styles.colorPicker}
      />
      <button type="button" onClick={onAddColor} className={styles.addColorButton}>
        <FontAwesomeIcon icon={faPlus} /> Add Color
      </button>
    </div>
  );
});

const RenderColorSwatchesComp = memo(function RenderColorSwatchesComp({
  colors,
  activeSwatch,
  onSwatchClick,
  onColorImageChange,
}: {
  colors: string[];
  activeSwatch: string | null;
  onSwatchClick: (color: string) => void;
  onColorImageChange: (color: string, e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className={styles.selectedColorsContainer}>
      {colors.map((color) => (
        <div key={color} className={styles.selectedColor}>
          <div
            className={styles.colorSwatch}
            style={{ backgroundColor: color }}
            title="Selected color"
            onClick={() => onSwatchClick(color)}
          />
          <label className={styles.swatchLabel}>{color}</label>
          {activeSwatch === color && (
            <div className={styles.swatchUploads}>
              {[0, 1, 2].map((slot) => (
                <div key={slot} className={styles.swatchUpload}>
                  <input
                    type="file"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0])
                        onColorImageChange(color, e);
                    }}
                    className={styles.swatchFileInput}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
});

const SizeChipsComp = memo(function SizeChipsComp({
  selectedSizes,
  onToggleSize,
}: {
  selectedSizes: string[];
  onToggleSize: (size: string) => void;
}) {
  const availableSizes = ["XS", "S", "M", "L", "XL", "XXL"];
  return (
    <div className={styles.sizeChipsContainer}>
      {availableSizes.map((size) => (
        <button
          key={size}
          type="button"
          onClick={() => onToggleSize(size)}
          className={`${styles.sizeChip} ${selectedSizes.includes(size) ? styles.sizeChipSelected : ""}`}
        >
          {size}
        </button>
      ))}
    </div>
  );
});