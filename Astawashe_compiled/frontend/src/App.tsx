import { Routes, Route } from 'react-router-dom';
import Layout from './AstaWashe/components/Layout';
import Chatbot from './AstaWashe/components/Chatbot';
import Home from './AstaWashe/pages/Home';
import About from './AstaWashe/pages/About';
import Service from './AstaWashe/pages/Service';
import Price from './AstaWashe/pages/Price';
import Contact from './AstaWashe/pages/Contact';
import Appointment from './AstaWashe/pages/Appointment';
import Blog from './AstaWashe/pages/Blog';
import BlogDetail from './AstaWashe/pages/BlogDetail';
import Community from './AstaWashe/pages/Community';
import Team from './AstaWashe/pages/Team';
import Testimonial from './AstaWashe/pages/Testimonial';
import Search from './AstaWashe/pages/Search';
import Dashboards from './AstaWashe/pages/Dashboards';
import Auth from './AstaWashe/pages/Auth';
import VerifyEmail from './AstaWashe/pages/VerifyEmail';
import PendingApproval from './AstaWashe/pages/PendingApproval';
import Hospitals from './AstaWashe/pages/Hospitals';
import PatientDashboard from './AstaWashe/pages/PatientDashboard';
import AdminDashboard from './AstaWashe/pages/AdminDashboard';
import HospitalDashboard from './AstaWashe/pages/HospitalDashboard';
import DoctorDashboard from './AstaWashe/pages/DoctorDashboard';
import NotificationsPage from './AstaWashe/pages/Notifications';
import CreateCase from './AstaWashe/pages/CreateCase';
import CaseDetail from './AstaWashe/pages/CaseDetail';
import Reminders from './AstaWashe/pages/Reminders';
import Habits from './AstaWashe/pages/Habits';
import './App.css';

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/pending-approval" element={<PendingApproval />} />

        {/* Role Dashboard Routes */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/*" element={<AdminDashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />

        <Route path="/hospital" element={<HospitalDashboard />} />
        <Route path="/hospital/*" element={<HospitalDashboard />} />
        <Route path="/hospital-dashboard" element={<HospitalDashboard />} />

        <Route path="/doctor" element={<DoctorDashboard />} />
        <Route path="/doctor/*" element={<DoctorDashboard />} />
        <Route path="/doctor-dashboard" element={<DoctorDashboard />} />

        <Route path="/patient" element={<PatientDashboard />} />
        <Route path="/patient/*" element={<PatientDashboard />} />
        <Route path="/patient-dashboard" element={<PatientDashboard />} />

        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/service" element={<Service />} />
          <Route path="/price" element={<Price />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/appointment" element={<Appointment />} />
          <Route path="/community" element={<Community />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog-detail" element={<BlogDetail />} />
          <Route path="/team" element={<Team />} />
          <Route path="/testimonial" element={<Testimonial />} />
          <Route path="/search" element={<Search />} />
          <Route path="/dashboards" element={<Dashboards />} />
          <Route path="/hospitals" element={<Hospitals />} />
          <Route path="/create-case" element={<CreateCase />} />
          <Route path="/case/:caseId" element={<CaseDetail />} />
          <Route path="/reminders" element={<Reminders />} />
          <Route path="/habits" element={<Habits />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="*" element={<Home />} />
        </Route>
      </Routes>
      <Chatbot />
    </>
  );
}
