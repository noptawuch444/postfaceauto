import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Layers, History, Settings, ExternalLink } from 'lucide-react';
import { V } from '../theme';

const AdminTabs = () => {
    const location = useLocation();

    const menuItems = [
        { name: 'แดชบอร์ด', path: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'จัดการเพจ', path: '/admin/pages', icon: BookOpen },
        { name: 'จัดการเทมเพลต', path: '/admin/templates', icon: Layers },
        { name: 'ประวัติการโพสต์', path: '/admin/posts', icon: History },
        { name: 'ตั้งค่าระบบ', path: '/admin/settings', icon: Settings },
    ];

    return (
        <div style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '32px',
            padding: '4px',
            background: 'rgba(255,255,255,0.02)',
            borderRadius: '14px',
            border: `1px solid ${V.bdr}`,
            width: 'fit-content'
        }}>
            {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`admin-tab ${isActive ? 'active' : ''}`}
                        style={{
                            textDecoration: 'none',
                            background: 'transparent',
                            border: 'none',
                            color: isActive ? V.pri : V.txtS,
                            padding: '12px 24px',
                            fontSize: '15px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            position: 'relative',
                            transition: 'all 0.2s',
                        }}
                    >
                        <Icon size={18} />
                        {item.name}
                        {isActive && (
                            <div style={{
                                position: 'absolute',
                                bottom: '-1px',
                                left: 0,
                                right: 0,
                                height: '3px',
                                background: V.pri,
                                boxShadow: `0 0 12px ${V.pri}`,
                                borderRadius: '3px 3px 0 0'
                            }} />
                        )}
                    </Link>
                );
            })}

            <div style={{ flex: 1 }} />

            <Link
                to="/connect-facebook"
                target="_blank"
                style={{
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 18px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: '700',
                    color: V.txtS,
                    background: 'rgba(255,255,255,0.03)',
                    border: `1px solid ${V.bdr}`,
                    transition: 'all 0.2s',
                    marginTop: '2px'
                }}
                className="admin-secondary-btn"
            >
                <ExternalLink size={14} />
                Go to Public
            </Link>

            <style>{`
                .admin-tab:hover {
                    color: ${V.priL} !important;
                }
                .admin-secondary-btn:hover {
                    background: rgba(255, 255, 255, 0.08) !important;
                    color: ${V.txt} !important;
                    border-color: ${V.priD} !important;
                    transform: translateY(-1px);
                }
            `}</style>
        </div>
    );
};

export default AdminTabs;
