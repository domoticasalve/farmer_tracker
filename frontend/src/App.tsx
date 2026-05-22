import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from './stores/authStore'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import GardenFormPage from './pages/GardenFormPage'
import GardenDetailPage from './pages/GardenDetailPage'
import AddPlantPage from './pages/AddPlantPage'
import PlantDetailPage from './pages/PlantDetailPage'
import type { ReactNode } from 'react'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: 1,
    },
  },
})

function Protected({ children }: { children: ReactNode }) {
  const { token } = useAuthStore()
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route path="/dashboard" element={
            <Protected><DashboardPage /></Protected>
          } />
          <Route path="/gardens/new" element={
            <Protected><GardenFormPage /></Protected>
          } />
          <Route path="/gardens/:id" element={
            <Protected><GardenDetailPage /></Protected>
          } />
          <Route path="/gardens/:id/edit" element={
            <Protected><GardenFormPage /></Protected>
          } />
          <Route path="/gardens/:id/plants/add" element={
            <Protected><AddPlantPage /></Protected>
          } />
          <Route path="/gardens/:id/plants/:gpId" element={
            <Protected><PlantDetailPage /></Protected>
          } />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
