import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { I18nProvider } from "../../hq/src/lib/i18n";
import { Shell } from "./components/Shell";
import { ToastProvider } from "./components/ui";
import { ClientBrief, ClientHome, Directory, MyJobs, PostJob, TalentProfile } from "./pages/client";
import { Applications, Network, OpsBriefs, OpsHome, QAQueue, ScreenBrief } from "./pages/ops";
import { Join } from "./pages/join";
import { Landing } from "./pages/shared";
import { Earnings, FindWork, JobDetail, MyProfile, MyProposals, SubmitProposal, TalentHome, Work } from "./pages/talent";

export function App() {
  return <I18nProvider><ToastProvider><BrowserRouter basename="/crew"><Routes>
    <Route path="/" element={<Landing />} />
    <Route path="/join" element={<Join />} />
    <Route path="/apply" element={<Navigate to="/join" replace />} />
    <Route path="/*" element={<Shell><Routes>
      <Route path="/client" element={<ClientHome />} />
      <Route path="/client/post" element={<PostJob />} />
      <Route path="/client/new" element={<Navigate to="/client/post" replace />} />
      <Route path="/client/jobs" element={<MyJobs />} />
      <Route path="/client/talent/:id" element={<TalentProfile />} />
      <Route path="/client/briefs/:id" element={<ClientBrief />} />
      <Route path="/client/talent" element={<Directory />} />
      <Route path="/talent" element={<TalentHome />} />
      <Route path="/talent/jobs" element={<FindWork />} />
      <Route path="/talent/jobs/:id" element={<JobDetail />} />
      <Route path="/talent/jobs/:id/apply" element={<SubmitProposal />} />
      <Route path="/talent/profile" element={<MyProfile />} />
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
