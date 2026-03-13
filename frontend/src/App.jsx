import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import AdminLayout from './components/AdminLayout';
import PublicLayout from './components/PublicLayout';


// Admin Pages
import AdminLogin from './pages/AdminLogin';
import Dashboard from './pages/Dashboard';
import PagesManage from './pages/PagesManage';
import TemplatesManage from './pages/TemplatesManage';
import PostsManage from './pages/PostsManage';
import AdminSettings from './pages/AdminSettings';

// Public Pages
import ConnectFacebook from './pages/ConnectFacebook';
import Waiting from './pages/Waiting';
import PublicPost from './pages/PublicPost';
import FacebookCallback from './pages/FacebookCallback';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

    const login = (token) => {
        localStorage.setItem('token', token);
        setIsAuthenticated(true);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
    };

    return (
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <div style={{ position: 'relative', minHeight: '100vh' }}>
                <Routes>
                    {/* Admin Routes */}
                    <Route path="/admin/login" element={
                        isAuthenticated ? <Navigate to="/admin/dashboard" /> : <AdminLogin onLogin={login} />
                    } />

                    <Route element={<AdminLayout isAuthenticated={isAuthenticated} onLogout={logout} />}>
                        <Route path="/admin/dashboard" element={<Dashboard />} />
                        <Route path="/admin/pages" element={<PagesManage />} />
                        <Route path="/admin/templates" element={<TemplatesManage />} />
                        <Route path="/admin/posts" element={<PostsManage />} />
                        <Route path="/admin/settings" element={<AdminSettings />} />
                    </Route>

                    {/* Public Routes */}
                    <Route element={<PublicLayout />}>
                        <Route path="/connect-facebook" element={<ConnectFacebook />} />
                        <Route path="/facebook/callback" element={<FacebookCallback />} />
                        <Route path="/waiting" element={<Waiting />} />
                        <Route path="/public/:slug" element={<PublicPost />} />
                    </Route>

                    {/* Default Redirects */}
                    <Route path="/admin" element={<Navigate to="/admin/dashboard" />} />
                    <Route path="/" element={<Navigate to="/connect-facebook" />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
