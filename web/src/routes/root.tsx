import { Outlet, ScrollRestoration } from 'react-router'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function Root() {
  return (
    <div className="shell grain flex min-h-screen flex-col">
      {/* Without this, following a footer link lands you at the bottom of the
          new page — the browser keeps the previous scroll offset. */}
      <ScrollRestoration />
      <Navbar />
      <main className="relative flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
