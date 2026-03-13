import { Outlet, Navigate } from 'react-router-dom';
import AdminTopNav from './AdminTopNav';
import AdminTabs from './AdminTabs';
import { V } from '../theme';

function AdminLayout({ isAuthenticated, onLogout }) {
    if (!isAuthenticated) {
        return <Navigate to="/admin/login" replace />;
    }

    return (
        <div className="adm" style={{
            backgroundColor: V?.bgMain || '#111115',
            minHeight: '100vh',
            fontFamily: '"Prompt", sans-serif',
            color: V.txt,
            display: 'flex',
            flexDirection: 'column',
            overflowX: 'hidden'
        }}>
            <AdminTopNav onLogout={onLogout} />

            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                padding: '40px 40px',
                maxWidth: '1600px',
                margin: '0 auto',
                width: '100%'
            }}>
                <AdminTabs />

                <main className="adm-main" style={{
                    flex: 1,
                    marginTop: '24px'
                }}>
                    <Outlet context={{ onLogout }} />
                </main>
            </div>

            <footer style={{
                marginTop: '60px',
                padding: '40px 0',
                textAlign: 'center',
                fontSize: '12px',
                color: V.txtM,
                opacity: 0.6,
                borderTop: `1px solid ${V.bdr}`,
                letterSpacing: '0.5px',
                background: V.bgSec
            }}>
                &copy; 2026 GoldSync AutoBot System | All Rights Reserved | Luxury Admin Suite
            </footer>

            <style>{`
                @keyframes gsFadeIn {
                    from { opacity: 0; transform: translateY(15px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                * {
                    box-sizing: border-box;
                }
            `}</style>
        </div>
    );
}

export default AdminLayout;
