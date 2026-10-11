import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Shell, useTheme } from "./components/Shell";
import { Spinner, ToastProvider } from "./components/ui";
import { I18nProvider } from "./lib/i18n";
import { useWs, WorkspaceProvider } from "./lib/ws";
import { Approvals } from "./pages/Approvals";
import { Calendar } from "./pages/Calendar";
import { Inbox } from "./pages/Inbox";
import { Integrations } from "./pages/Integrations";
import { Portal } from "./pages/Portal";
import { Auth } from "./pages/Auth";
import { ChangeOrders } from "./pages/ChangeOrders";
import { ChangeOrderReview } from "./pages/ChangeOrderReview";
import { ClientDetail, Clients } from "./pages/Clients";
import { Dashboard } from "./pages/Dashboard";
import { DeliverableDetail } from "./pages/DeliverableDetail";
import { Join } from "./pages/Join";
import { Ledger } from "./pages/Ledger";
import { Onboarding } from "./pages/Onboarding";
import { ProjectDetail, Projects } from "./pages/Projects";
import { Review } from "./pages/Review";
import { Settings } from "./pages/Settings";
import { Tasks } from "./pages/Tasks";
import { Team } from "./pages/Team";

function Private() {
  const { ready, user, ws } = useWs();
  useTheme();
  if (!ready) return <Spinner />;
  if (!user) return <Auth />;
  if (!ws) return <Onboarding />;
  return <Shell>
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/approvals" element={<Approvals />} />
      <Route path="/deliverables/:id" element={<DeliverableDetail />} />
      <Route path="/projects" element={<Projects />} />
      <Route path="/projects/:id" element={<ProjectDetail />} />
      <Route path="/clients" element={<Clients />} />
      <Route path="/clients/:id" element={<ClientDetail />} />
      <Route path="/tasks" element={<Tasks />} />
      <Route path="/calendar" element={<Calendar />} />
      <Route path="/inbox" element={<Inbox />} />
      <Route path="/integrations" element={<Integrations />} />
      <Route path="/extra-work" element={<ChangeOrders />} />
      <Route path="/history" element={<Ledger />} />
      <Route path="/change-orders" element={<Navigate to="/extra-work" replace />} />
      <Route path="/ledger" element={<Navigate to="/history" replace />} />
      <Route path="/team" element={<Team />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/new-workspace" element={<Onboarding inline />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Shell>;
}

export function App() {
  return <BrowserRouter basename="/app">
    <ToastProvider>
      <Routes>
        {/* Public pages for clients: no login, opened from WhatsApp links */}
        <Route path="/r/:token" element={<Review />} />
        <Route path="/co/:token" element={<ChangeOrderReview />} />
        <Route path="/c/:token" element={<Portal />} />
        <Route path="/*" element={<I18nProvider><WorkspaceProvider><Routes>
          <Route path="/join/:token" element={<Join />} />
          <Route path="/*" element={<Private />} />
        </Routes></WorkspaceProvider></I18nProvider>} />
      </Routes>
    </ToastProvider>
  </BrowserRouter>;
}
