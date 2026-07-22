import { Routes, Route } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { RequireAuth } from '@/components/RequireAuth'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { RuleListPage } from '@/pages/RuleListPage'
import { NewRulePage } from '@/pages/NewRulePage'
import { RuleDetailPage } from '@/pages/RuleDetailPage'
import { ApprovalCenterPage } from '@/pages/ApprovalCenterPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { AnalyticsPage } from '@/pages/AnalyticsPage'
import { CategoryManagementPage } from '@/pages/CategoryManagementPage'
import { HistoryPage } from '@/pages/HistoryPage'
import { ReportsPage } from '@/pages/ReportsPage'
import { ComingSoonPage } from '@/pages/ComingSoonPage'
import { navConfig } from '@/routes/navConfig'

const STUBBED_PATHS = new Set([
  '/',
  '/rules',
  '/approvals',
  '/settings',
  '/analytics',
  '/categories',
  '/history',
  '/reports',
])

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/rules" element={<RuleListPage />} />
          <Route path="/rules/new" element={<NewRulePage />} />
          <Route path="/rules/:id" element={<RuleDetailPage />} />
          <Route path="/approvals" element={<ApprovalCenterPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/categories" element={<CategoryManagementPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          {navConfig
            .filter((item) => !STUBBED_PATHS.has(item.path))
            .map((item) => (
              <Route key={item.path} path={item.path} element={<ComingSoonPage title={item.label} />} />
            ))}
        </Route>
      </Route>
    </Routes>
  )
}

export default App
