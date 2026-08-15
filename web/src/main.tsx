import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { PostHogProvider } from '@posthog/react'
import './index.css'
import Root from './routes/root'
import Home from './routes/home'
import LegalPage from './routes/legal'
import FeatureRoute from './routes/feature'
import Pricing from './routes/pricing'
import About from './routes/about'
import Help from './routes/help'
import NotFound from './routes/not-found'
import { privacyPolicy, termsOfUse } from './content/legal'
import { faceScan, routines, productScanner } from './content/features'
import { posthog, initAnalytics } from './lib/analytics'

initAnalytics()

const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />,
    children: [
      {
        index: true,
        element: <Home />,
        loader: () => null,
      },
      {
        path: 'face-scan',
        element: <FeatureRoute page={faceScan} />,
        loader: () => null,
      },
      {
        path: 'routines',
        element: <FeatureRoute page={routines} />,
        loader: () => null,
      },
      {
        path: 'product-scanner',
        element: <FeatureRoute page={productScanner} />,
        loader: () => null,
      },
      {
        path: 'pricing',
        element: <Pricing />,
        loader: () => null,
      },
      {
        path: 'about',
        element: <About />,
        loader: () => null,
      },
      {
        path: 'help',
        element: <Help />,
        loader: () => null,
      },
      {
        path: 'privacy',
        element: <LegalPage doc={privacyPolicy} />,
        loader: () => null,
      },
      {
        path: 'terms',
        element: <LegalPage doc={termsOfUse} />,
        loader: () => null,
      },
      {
        // The SPA rewrite means every unmatched path reaches the router, so it
        // has to answer for them rather than render a blank shell.
        path: '*',
        element: <NotFound />,
        loader: () => null,
      },
    ],
    loader: () => null,
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PostHogProvider client={posthog}>
      <RouterProvider router={router} />
    </PostHogProvider>
  </StrictMode>,
)
