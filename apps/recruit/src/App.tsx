import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { I18nProvider } from "../../hq/src/lib/i18n";
import { Applications, JobDetail, Jobs, Profile } from "./pages/candidate";
import { Applicant, CompanyHome, CompanyJob, CompanyJobs, PostJob } from "./pages/company";
import { Queue, Review } from "./pages/screening";
import { Landing, Shell, ToastProvider } from "./ui";

export function App() {
  return <I18nProvider><ToastProvider><BrowserRouter basename="/recruit"><Routes>
    <Route path="/" element={<Landing />} />
    <Route path="/*" element={<Shell><Routes>
      <Route path="/jobs" element={<Jobs />} />
      <Route path="/jobs/:id" element={<JobDetail />} />
      <Route path="/applications" element={<Applications />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/company" element={<CompanyHome />} />
      <Route path="/company/post" element={<PostJob />} />
      <Route path="/company/jobs" element={<CompanyJobs />} />
      <Route path="/company/jobs/:id" element={<CompanyJob />} />
      <Route path="/company/applicants/:id" element={<Applicant />} />
      <Route path="/screening" element={<Queue />} />
      <Route path="/screening/done" element={<Queue done />} />
      <Route path="/screening/review/:id" element={<Review />} />
      <Route path="*" element={<Navigate to="/jobs" replace />} />
    </Routes></Shell>} />
  </Routes></BrowserRouter></ToastProvider></I18nProvider>;
}
