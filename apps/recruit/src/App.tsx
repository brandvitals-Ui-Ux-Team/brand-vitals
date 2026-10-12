import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { I18nProvider } from "../../hq/src/lib/i18n";
import { SignIn, SignUp } from "./pages/auth";
import { Applications, CompanyPage, JobDetail, Jobs, Profile, Saved } from "./pages/candidate";
import { Applicant, CompanyHome, CompanyJob, CompanyJobs, PostJob } from "./pages/company";
import { Queue, Review } from "./pages/screening";
import { Landing, Need, Shell, ToastProvider } from "./ui";

// Jobs and company pages are public; everything else belongs to one role.
export function App() {
  return <I18nProvider><ToastProvider><BrowserRouter basename="/recruit"><Routes>
    <Route path="/" element={<Landing />} />
    <Route path="/signin" element={<SignIn />} />
    <Route path="/signup" element={<SignUp />} />
    <Route path="/*" element={<Shell><Routes>
      <Route path="/jobs" element={<Jobs />} />
      <Route path="/jobs/:id" element={<JobDetail />} />
      <Route path="/companies/:id" element={<CompanyPage />} />
      <Route path="/applications" element={<Need role="candidate"><Applications /></Need>} />
      <Route path="/profile" element={<Need role="candidate"><Profile /></Need>} />
      <Route path="/saved" element={<Need role="candidate"><Saved /></Need>} />
      <Route path="/company" element={<Need role="company"><CompanyHome /></Need>} />
      <Route path="/company/post" element={<Need role="company"><PostJob /></Need>} />
      <Route path="/company/jobs" element={<Need role="company"><CompanyJobs /></Need>} />
      <Route path="/company/jobs/:id" element={<Need role="company"><CompanyJob /></Need>} />
      <Route path="/company/applicants/:id" element={<Need role="company"><Applicant /></Need>} />
      <Route path="/screening" element={<Need role="screening"><Queue /></Need>} />
      <Route path="/screening/done" element={<Need role="screening"><Queue done /></Need>} />
      <Route path="/screening/review/:id" element={<Need role="screening"><Review /></Need>} />
      <Route path="*" element={<Navigate to="/jobs" replace />} />
    </Routes></Shell>} />
  </Routes></BrowserRouter></ToastProvider></I18nProvider>;
}
