import { createBrowserRouter } from 'react-router'
import RootLayout from './components/RootLayout'
import ArticlePage from './pages/ArticlePage'
import EcosystemPage from './pages/EcosystemPage'
import HomePage from './pages/HomePage'
import LegalPage from './pages/LegalPage'
import NotFoundPage from './pages/NotFoundPage'
import ResearchPage from './pages/ResearchPage'
import RoadmapPage from './pages/RoadmapPage'
import TechnologyPage from './pages/TechnologyPage'
import VisionPage from './pages/VisionPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    hydrateFallbackElement: <div className="flex min-h-screen items-center justify-center gap-3 text-sm text-white/65" role="status"><span className="signal-dot" /> Loading the workspace…</div>,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'vision', element: <VisionPage /> },
      { path: 'technology', element: <TechnologyPage /> },
      { path: 'research', element: <ResearchPage /> },
      { path: 'research/:slug', element: <ArticlePage /> },
      { path: 'roadmap', element: <RoadmapPage /> },
      { path: 'ecosystem', element: <EcosystemPage /> },
      // The interactive utilities are split out so the content pages stay light.
      { path: 'swap', lazy: async () => ({ Component: (await import('./pages/SwapPage')).default }) },
      { path: 'assistant', lazy: async () => ({ Component: (await import('./pages/AssistantPage')).default }) },
      { path: 'pqc', lazy: async () => ({ Component: (await import('./pages/PqcPage')).default }) },
      { path: 'web3', lazy: async () => ({ Component: (await import('./pages/Web3Page')).default }) },
      { path: 'checks', lazy: async () => ({ Component: (await import('./pages/ChecksPage')).default }) },
      { path: 'checks/:id', lazy: async () => ({ Component: (await import('./pages/CheckDetailPage')).default }) },
      { path: 'terms', element: <LegalPage slug="terms" /> },
      { path: 'privacy', element: <LegalPage slug="privacy" /> },
      { path: 'disclaimer', element: <LegalPage slug="disclaimer" /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
