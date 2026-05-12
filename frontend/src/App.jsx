import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect, lazy, Suspense } from 'react';
import AdminLayout from './components/AdminLayout';
import PublicLayout from './components/PublicLayout';
import { Loader2 } from 'lucide-react';

// Lazy Load Pages
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const PagesManage = lazy(() => import('./pages/PagesManage'));
const TemplatesManage = lazy(() => import('./pages/TemplatesManage'));
const PostsManage = lazy(() => import('./pages/PostsManage'));
const AdminSettings = lazy(() => import('./pages/AdminSettings'));
const ConnectFacebook = lazy(() => import('./pages/ConnectFacebook'));
const Waiting = lazy(() => import('./pages/Waiting'));
const PublicPost = lazy(() => import('./pages/PublicPost'));
const FacebookCallback = lazy(() => import('./pages/FacebookCallback'));

// Loading Screen
const PageLoader = () => (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0b' }}>
        <Loader2 className="animate-spin" size={40} style={{ color: '#c9a84c' }} />
    </div>
);

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
    const [user, setUser] = useState(null);

    useEffect(() => {
        // Redirect from old Render domain to Vercel
        if (window.location.hostname.includes('onrender.com')) {
            window.location.href = 'https://postfaceauto.vercel.app' + window.location.pathname + window.location.search;
            return;
        }

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
                <Suspense fallback={<PageLoader />}>
                    <Routes>
                        <Route path="/login" element={
                            isAuthenticated ? <Navigate to="/admin/dashboard" /> : <AdminLogin onLogin={login} />
                        } />
                        <Route path="/admin/login" element={<Navigate to="/login" />} />

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
                            
                            {/* Policy pages - we load them from the lazy container */}
                            <Route path="/privacy" element={<PrivacyPolicy />} />
                            <Route path="/terms" element={<TermsOfService />} />
                            <Route path="/data-deletion" element={<DataDeletion />} />
                        </Route>

                        {/* Default Redirects */}
                        <Route path="/admin" element={<Navigate to="/admin/dashboard" />} />
                        <Route path="/" element={<Navigate to={isAuthenticated ? "/admin/dashboard" : "/login"} />} />
                    </Routes>
                </Suspense>
            </div>
        </Router>
    );
}

// Named export lazy wrappers
const PrivacyPolicy = lazy(() => import('./pages/PolicyPages').then(m => ({ default: m.PrivacyPolicy })));
const TermsOfService = lazy(() => import('./pages/PolicyPages').then(m => ({ default: m.TermsOfService })));
const DataDeletion = lazy(() => import('./pages/PolicyPages').then(m => ({ default: m.DataDeletion })));

export default App;
