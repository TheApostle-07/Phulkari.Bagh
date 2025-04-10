// app/admin/login/layout.tsx

import { ReactNode } from "react"

export const metadata = {
  title: "Admin Login | Phulkari Bagh",
  description: "Login to access the admin panel.",
}

export default function AdminLoginLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}