// app/admin/(protected)/layout.tsx

import { ReactNode } from "react"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import jwt from "jsonwebtoken"
import "../../admin/admin.css" // Import your CSS file for admin styles

export const metadata = {
  title: "Admin Panel | Phulkari Bagh",
  description: "Admin panel for managing products, images, and orders.",
}

interface AdminLayoutProps {
  children: ReactNode
}

const SECRET_KEY = process.env.JWT_SECRET || "CHANGE_THIS_TO_A_LONG_RANDOM_STRING"

export default async function ProtectedAdminLayout({ children }: AdminLayoutProps) {
  const cookieStore = await cookies()
  const token = cookieStore.get("admin_jwt")?.value

  if (!token) {
    redirect("/admin/login")
  }

  try {
    jwt.verify(token, SECRET_KEY)
  } catch (err) {
    redirect("/admin/login")
  }

  return (
    <html lang="en">
      <body>
        
          {/* Main Content Area */}
          <main className="admin-main">{children}</main>
        
      </body>
    </html>
  )
}