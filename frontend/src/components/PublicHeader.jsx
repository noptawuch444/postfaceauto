import { FileText, LogOut, Globe } from 'lucide-react';
import { V } from '../theme';

const PublicHeader = ({ template }) => {
    return (
        <header className="gs-public-header" style={{
            height: '96px',
            margin: 0,
            borderRadius: 0,
            borderBottom: `1px solid ${V.bdr}`,
            padding: '0 40px',
            background: V.bgSec,
            position: 'relative',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0
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
                        }}>AUTOBOT</span>
                    </div>
                    <div style={{
                        fontSize: '12px',
                        color: V.txtM,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        marginTop: '2px'
                    }}>
                        <FileText size={12} /> เพจเฟสบุ๊ค: <b style={{ color: V.pri }}>{template?.template_name}</b>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
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
                        <Globe size={18} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: '700', fontSize: '13px', color: V.priL, lineHeight: 1.2 }}>สถานะระบบ</span>
                        <span style={{
                            fontSize: '10px',
                            color: V.ok,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontWeight: '700',
                            marginTop: '2px'
                        }}>
                            <div className="nav-dot-pulse" style={{ width: '6px', height: '6px' }} /> ออนไลน์
                        </span>
                    </div>
                    <button
                        onClick={() => { sessionStorage.clear(); window.location.reload(); }}
                        className="nav-logout-btn"
                        title="ล็อคเอาท์"
                        style={{
                            background: 'rgba(201, 168, 76, 0.08)',
                            border: '1px solid rgba(180, 150, 60, 0.22)',
                            color: V.txtS,
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
                        <LogOut size={16} color="#ff4d4d" />
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
                    background: ${V.pri} !important;
                    color: #1a1200 !important;
                    box-shadow: 0 0 10px rgba(201, 168, 76, 0.4);
                }
                @keyframes nav-pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.2); opacity: 0.7; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </header>
    );
};

export default PublicHeader;
