import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import AdminLayout from './components/AdminLayout';
import PublicLayout from './components/PublicLayout';


// Admin Pages
import AdminLogin from './pages/AdminLogin';
import Register from './pages/Register'; // [NEW]
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
import { PrivacyPolicy, TermsOfService, DataDeletion } from './pages/PolicyPages';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
    const [user, setUser] = useState(null);

    useEffect(() => {
        if (isAuthenticated) {
            fetch('/api/auth/me', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            })
            .then(res => res.json())
            .then(data => setUser(data))
            .catch(() => logout());
        }
    }, [isAuthenticated]);

    const login = (token) => {
        localStorage.setItem('token', token);
        setIsAuthenticated(true);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        setUser(null);
    };

    return (
        <Router>
            <div style={{ position: 'relative', minHeight: '100vh' }}>
                <Routes>
                    {/* Auth Routes */}
                    <Route path="/login" element={
                        isAuthenticated ? <Navigate to="/admin/dashboard" /> : <AdminLogin onLogin={login} />
                    } />
                    <Route path="/admin/login" element={<Navigate to="/login" />} />
                    <Route path="/register" element={
                        isAuthenticated ? <Navigate to="/admin/dashboard" /> : <Register onLogin={login} />
                    } />

                    <Route element={<AdminLayout isAuthenticated={isAuthenticated} onLogout={logout} user={user} />}>
                        <Route path="/admin/dashboard" element={
                            user?.role === 'admin' ? <Dashboard /> : <Navigate to="/admin/pages" />
                        } />
                        <Route path="/admin/pages" element={<PagesManage user={user} />} />
                        <Route path="/admin/templates" element={
                            user?.role === 'admin' ? <TemplatesManage /> : <Navigate to="/admin/pages" />
                        } />
                        <Route path="/admin/posts" element={
                            user?.role === 'admin' ? <PostsManage /> : <Navigate to="/admin/pages" />
                        } />
                        <Route path="/admin/settings" element={
                            user?.role === 'admin' ? <AdminSettings /> : <Navigate to="/admin/pages" />
                        } />
                    </Route>

                    {/* Public/Shared Routes */}
                    <Route element={<PublicLayout />}>
                        <Route path="/connect-facebook" element={<ConnectFacebook />} />
                        <Route path="/facebook/callback" element={<FacebookCallback />} />
                        <Route path="/waiting" element={<Waiting />} />
                        <Route path="/public/:slug" element={<PublicPost />} />
                        <Route path="/privacy" element={<PrivacyPolicy />} />
                        <Route path="/terms" element={<TermsOfService />} />
                        <Route path="/data-deletion" element={<DataDeletion />} />
                    </Route>

                    {/* Default Redirects */}
                    <Route path="/admin" element={<Navigate to="/admin/dashboard" />} />
                    <Route path="/" element={<Navigate to={isAuthenticated ? "/admin/dashboard" : "/login"} />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
