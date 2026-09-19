import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './components/Toast.jsx';
import Nav, { Footer } from './components/Nav.jsx';
import Home from './pages/Home.jsx';
import Courses from './pages/Courses.jsx';
import Watch from './pages/Watch.jsx';
import Redeem from './pages/Redeem.jsx';
import Login from './pages/Login.jsx';
import AdminLayout from './pages/admin/AdminLayout.jsx';
import Dashboard from './pages/admin/Dashboard.jsx';
import AdminVideos from './pages/admin/AdminVideos.jsx';
import AdminCodes from './pages/admin/AdminCodes.jsx';
import AdminRecords from './pages/admin/AdminRecords.jsx';

function PublicLayout() {
  return (
    <>
      <Nav />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/watch/:id" element={<Watch />} />
          <Route path="/redeem" element={<Redeem />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}

function NotFound() {
  return (
    <div className="notfound">
      <h1>404</h1>
      <p>页面不存在或已被移除</p>
      <a href="/" className="btn">返回首页</a>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/admin/*" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="videos" element={<AdminVideos />} />
            <Route path="codes" element={<AdminCodes />} />
            <Route path="records" element={<AdminRecords />} />
          </Route>
          <Route path="*" element={<PublicLayout />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
