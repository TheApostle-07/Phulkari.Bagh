import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import Providers from "./providers"; // Adjust the import path as needed
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/** 
 * Configure Poppins:
 * - You can add any weights or subsets you need.
 * - The "variable" property allows you to reference this font in CSS with
 *   `font-family: var(--font-poppins)`.
 */
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-poppins",
});

// Next.js metadata
export const metadata: Metadata = {
  title: "House of Phulkari",
  description: "Experience vibrant Phulkari embroidery in all its glory.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={poppins.variable}>
      <body className="antialiased">
        
          {children}
          {/* Add the ToastContainer here */}
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        
      </body>
    </html>
  );
}