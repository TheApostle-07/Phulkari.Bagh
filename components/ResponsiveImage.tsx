"use client";
import React, { useState } from "react";
import Image, { ImageProps } from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import styles from "./ResponsiveImage.module.css";

interface ResponsiveImageProps extends ImageProps {
  /** Determines how the image should resize:
   * - "cover": The image fills the container, possibly cropping portions (recommended for full background-like images).
   * - "contain": The entire image is visible, with letterboxing if needed.
   */
  fit?: "cover" | "contain";
  loaderSize?: number; // in pixels
}

const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  fit = "contain",
  loaderSize = 30,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className={styles.imageContainer}>
      {!isLoaded && (
        <div className={styles.spinner}>
          <FontAwesomeIcon icon={faSpinner} spin style={{ fontSize: loaderSize }} />
        </div>
      )}
      <Image
        {...props}
        onLoadingComplete={() => setIsLoaded(true)}
        style={{
          objectFit: fit,
          objectPosition: "center",
          opacity: isLoaded ? 1 : 0,
          transition: "opacity 0.3s ease-in-out",
        }}
      />
    </div>
  );
};

export default ResponsiveImage;