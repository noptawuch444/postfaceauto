import React from 'react';
import { Database, LogOut, ShieldCheck, ExternalLink } from 'lucide-react';
import { V } from '../theme';

const AdminTopNav = ({ onLogout }) => {
    return (
        <nav className="adm-header" style={{
            height: '96px',
            margin: 0,
            borderRadius: 0,
            borderBottom: `1px solid ${V.bdr}`,
            padding: '0 40px',
            background: V.bgSec,
            position: 'relative',
            zIndex: 1000
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
            }}>
                <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: `1.5px solid ${V.priD}`,
                    boxShadow: `0 0 15px ${V.pri}40`,
                    background: '#000'
                }}>
                    <img src="/GOLDSYNC.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <div>
                    <div style={{
                        fontSize: '22px',
                        fontWeight: '800',
                        color: V.priL,
                        letterSpacing: '-0.5px'
                    }}>
                        GoldSync AutoBot <span style={{
                            fontSize: '10px',
                            background: 'rgba(201, 168, 76, 0.1)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            color: V.pri,
                            marginLeft: '6px',
                            verticalAlign: 'middle',
                            fontWeight: '700'
                        }}>ADMIN</span>
                    </div>
                    <div style={{
                        fontSize: '12px',
                        color: V.txtM,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        marginTop: '2px'
                    }}>
                        <Database size={12} /> ระบบจัดการหลังบ้านระดับพรีเมียม
                    </div>
                </div>
            </div>

            <div style={{ flex: 1 }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: '3px'
                }}>
                    <small style={{
                        fontSize: '11px',
                        color: V.txtM,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}>เซิร์ฟเวอร์สถานะ</small>
                    <span style={{
                        fontSize: '15px',
                        color: V.ok,
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <div className="nav-dot-pulse" /> ออนไลน์
                    </span>
                </div>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px 16px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid ${V.bdr}`,
                    borderRadius: '12px'
                }}>
                    <div style={{
                        width: '32px',
                        height: '32px',
                        background: V.pri,
                        color: '#1a1200',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '15px',
                        fontWeight: '800'
                    }}>
                        <ShieldCheck size={18} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: '700', fontSize: '14px', color: V.txt, lineHeight: 1 }}>แอดมิน</span>
                        <span style={{ fontSize: '10px', color: V.txtM }}>Super Admin</span>
                    </div>
                    <button
                        onClick={onLogout}
                        className="nav-logout-btn"
                        style={{
                            background: 'rgba(224, 85, 85, 0.1)',
                            border: '1px solid rgba(224, 85, 85, 0.2)',
                            color: V.err,
                            padding: '6px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s',
                            marginLeft: '8px'
                        }}
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </div>

            <style>{`
                .nav-dot-pulse {
                    width: 8px;
                    height: 8px;
                    background: currentColor;
                    border-radius: 50%;
                    box-shadow: 0 0 8px currentColor;
                    animation: nav-pulse 2s infinite;
                }
                .nav-logout-btn:hover {
                    background: ${V.err} !important;
                    color: #fff !important;
                    box-shadow: 0 0 10px rgba(224, 85, 85, 0.4);
                }
                @keyframes nav-pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.2); opacity: 0.7; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </nav>
    );
};

export default AdminTopNav;
