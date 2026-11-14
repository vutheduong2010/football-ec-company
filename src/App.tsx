import { Route, Routes } from 'react-router-dom'

import { AppShell } from './app/AppShell'
import { DrawPage } from './pages/DrawPage'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { PlayersPage } from './pages/PlayersPage'
import { ResultDetailPage } from './pages/ResultDetailPage'
import { ResultsPage } from './pages/ResultsPage'

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="players" element={<PlayersPage />} />
        <Route path="draw" element={<DrawPage />} />
        <Route path="results" element={<ResultsPage />} />
        <Route path="results/:id" element={<ResultDetailPage />} />
        <Route path="admin/login" element={<LoginPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
