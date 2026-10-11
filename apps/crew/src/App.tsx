import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { I18nProvider } from "../../hq/src/lib/i18n";
import { Shell } from "./components/Shell";
import { ToastProvider } from "./components/ui";
import { ClientBrief, ClientHome, Directory, NewBrief } from "./pages/client";
import { Applications, Network, OpsBriefs, OpsHome, QAQueue, ScreenBrief } from "./pages/ops";
import { Apply, Landing } from "./pages/shared";
import { Earnings, MyProposals, Opportunities, TalentHome, Work } from "./pages/talent";

export function App() {
  return <I18nProvider><ToastProvider><BrowserRouter basename="/crew"><Routes>
    <Route path="/" element={<Landing />} />
    <Route path="/apply" element={<Apply />} />
    <Route path="/*" element={<Shell><Routes>
      <Route path="/client" element={<ClientHome />} />
      <Route path="/client/new" element={<NewBrief />} />
      <Route path="/client/briefs/:id" element={<ClientBrief />} />
      <Route path="/client/talent" element={<Directory />} />
      <Route path="/talent" element={<TalentHome />} />
      <Route path="/talent/jobs" element={<Opportunities />} />
      <Route path="/talent/proposals" element={<MyProposals />} />
      <Route path="/talent/work" element={<Work />} />
      <Route path="/talent/earnings" element={<Earnings />} />
      <Route path="/ops" element={<OpsHome />} />
      <Route path="/ops/applications" element={<Applications />} />
      <Route path="/ops/briefs" element={<OpsBriefs />} />
      <Route path="/ops/briefs/:id" element={<ScreenBrief />} />
      <Route path="/ops/qa" element={<QAQueue />} />
      <Route path="/ops/talent" element={<Network />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes></Shell>} />
  </Routes></BrowserRouter></ToastProvider></I18nProvider>;
}
