import { Outlet } from 'react-router-dom';
import Topbar from './Topbar';
import Navbar from './Navbar';
import Footer from './Footer';

export default function Layout() {
  return (
    <>
      <Topbar />
      <Navbar />
      <Outlet />
      <Footer />
    </>
  );
}
