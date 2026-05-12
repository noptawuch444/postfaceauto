import React, { useState } from 'react';
import { Facebook, Link as LinkIcon, AlertCircle, Loader2, Key, Hash } from 'lucide-react';
import { V } from '../theme';
import GoldenSnow from '../components/GoldenSnow';

function ConnectFacebook() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showManual, setShowManual] = useState(false);
    const [pageId, setPageId] = useState('');
    const [pageToken, setPageToken] = useState('');
    const token = localStorage.getItem('token');

    const handleConnect = async () => {
        if (!token) {
            setError('กรุณาเข้าสู่ระบบก่อนเชื่อมต่อเพจ');
            window.location.href = '/login';
            return;
        }

        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/facebook/auth-url', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                setError('ไม่สามารถรับ URL การเชื่อมต่อได้');
                setLoading(false);
            }
        } catch (err) {
            setError('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
            setLoading(false);
        }
    };

    const handleManualConnect = async (e) => {
        e.preventDefault();
        if (!token) return;
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const res = await fetch('/api/facebook/manual-connect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ pageId, pageAccessToken: pageToken })
            });
            const data = await res.json();
            if (res.ok) {
                setSuccess('เชื่อมต่อเพจสำเร็จแล้ว!');
                setPageId('');
                setPageToken('');
                setTimeout(() => {
                    window.location.href = '/admin/pages';
                }, 1500);
            } else {
                setError(data.error || 'ไม่สามารถเชื่อมต่อเพจได้ ตรวจสอบ Token อีกครั้ง');
            }
        } catch (err) {
            setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
        } finally {
            setLoading(false);
        }
    };

    const handleManualConnect = async (e) => {
        e.preventDefault();
        if (!token) return;
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const res = await fetch('/api/facebook/manual-connect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ pageId, pageAccessToken: pageToken })
            });
            const data = await res.json();
            if (res.ok) {
                setSuccess('เชื่อมต่อเพจสำเร็จแล้ว!');
                setPageId('');
                setPageToken('');
                setTimeout(() => {
                    window.location.href = '/admin/pages';
                }, 1500);
            } else {
                setError(data.error || 'ไม่สามารถเชื่อมต่อเพจได้ ตรวจสอบ Token อีกครั้ง');
            }
        } catch (err) {
            setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="gs-connect-container" style={{
            background: V.bgMain,
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: '"Prompt", sans-serif',
            color: V.txt,
            position: 'relative',
            overflow: 'hidden',
            padding: '20px'
        }}>
            <GoldenSnow />

            <div className="gs-connect-card" style={{
                width: '100%',
                maxWidth: '500px',
                textAlign: 'center',
                padding: '48px 40px',
                background: V.bgSec,
                borderRadius: '24px',
                border: `1.5px solid ${V.bdr}`,
                boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
                position: 'relative',
                zIndex: 1001
            }}>
                <div className="gs-ultimate-logo-container" style={{ position: 'relative', margin: '0 auto 40px', width: '120px', height: '120px', perspective: '1000px' }}>
                    {/* Orbiting Rings */}
                    <div className="gs-orbit-ring gs-orbit-1" />
                    <div className="gs-orbit-ring gs-orbit-2" />

                    {/* Sparkles */}
                    <div className="gs-sparkle s1" />
                    <div className="gs-sparkle s2" />
                    <div className="gs-sparkle s3" />

                    <div className="gs-logo-3d-wrapper">
                        <div className="gs-connect-logo-ultimate" style={{
                            width: '100px',
                            height: '100px',
                            background: `conic-gradient(from 45deg, ${V.priD}, #000, ${V.priD}, #000, ${V.priD})`,
                            border: `2px solid ${V.pri}`,
                            borderRadius: '28px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: V.pri,
                            boxShadow: `
                                0 0 40px ${V.pri}40, 
                                inset 0 0 20px rgba(201,168,76,0.5),
                                0 10px 20px rgba(0,0,0,0.5)
                            `,
                            position: 'relative',
                            overflow: 'hidden',
                            zIndex: 10,
                            transformStyle: 'preserve-3d'
                        }}>
                            <Facebook size={48} style={{ filter: `drop-shadow(0 4px 12px ${V.pri}80)`, transform: 'translateZ(20px)' }} />
                        </div>

                        {/* Glow Base */}
                        <div className="gs-logo-glow-base" style={{
                            position: 'absolute',
                            inset: '-15px',
                            background: `radial-gradient(circle, ${V.pri}30 0%, transparent 70%)`,
                            zIndex: 1,
                            borderRadius: '32px',
                            animation: 'gs-glow-pulse 3s ease-in-out infinite'
                        }} />
                    </div>
                </div>

                <h2 className="gs-connect-title" style={{
                    fontSize: '26px',
                    fontWeight: '800',
                    marginBottom: '16px',
                    color: V.priL,
                    letterSpacing: '-0.5px'
                }}>เชื่อมต่อ Facebook Page</h2>

                <p style={{
                    color: V.txtM,
                    fontSize: '15px',
                    lineHeight: '1.6',
                    marginBottom: '36px'
                }}>
                    ยินดีต้อนรับเข้าสู่ระบบโพสต์อัตโนมัติ<br />
                    กรุณาเชื่อมต่อเพจ Facebook เพื่อเริ่มใช้งานระบบ
                </p>

                {error && (
                    <div style={{
                        background: 'rgba(224, 85, 85, 0.1)',
                        color: V.err,
                        padding: '14px',
                        borderRadius: '12px',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        marginBottom: '28px',
                        border: '1px solid rgba(224, 85, 85, 0.2)'
                    }}>
                        <AlertCircle size={18} /> {error}
                    </div>
                )}

                {!showManual ? (
                    <>
                        <button
                            onClick={handleConnect}
                            className="gs-connect-btn"
                            style={{
                                width: '100%',
                                height: '58px',
                                fontSize: '16px',
                                fontWeight: '800',
                                background: `linear-gradient(135deg, ${V.pri}, ${V.priD})`,
                                color: V.bgMain,
                                border: 'none',
                                borderRadius: '14px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '12px',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: `0 8px 25px ${V.pri}40`
                            }}
                            disabled={loading}
                            onMouseOver={e => {
                                e.currentTarget.style.transform = 'translateY(-2px) scale(1.01)';
                                e.currentTarget.style.boxShadow = `0 12px 35px ${V.pri}60`;
                            }}
                            onMouseOut={e => {
                                e.currentTarget.style.transform = 'none';
                                e.currentTarget.style.boxShadow = `0 8px 25px ${V.pri}40`;
                            }}
                        >
                            {loading ? <Loader2 className="animate-spin" size={24} /> : (
                                <> เริ่มต้นเชื่อมต่อ <LinkIcon size={20} /> </>
                            )}
                        </button>
                        
                        <div style={{ marginTop: '24px' }}>
                            <button 
                                onClick={() => setShowManual(true)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: V.pri,
                                    fontSize: '14px',
                                    cursor: 'pointer',
                                    textDecoration: 'underline'
                                }}
                            >
                                พบปัญหาการเชื่อมต่อ? ใช้การเชื่อมต่อแบบกรอกรหัส (Manual)
                            </button>
                        </div>
                    </>
                ) : (
                    <form onSubmit={handleManualConnect} style={{ textAlign: 'left' }}>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '14px', color: V.txtM, marginBottom: '8px' }}>
                                <Hash size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }}/> Page ID
                            </label>
                            <input 
                                type="text" 
                                value={pageId}
                                onChange={(e) => setPageId(e.target.value)}
                                placeholder="เช่น 1054326789..."
                                required
                                style={{
                                    width: '100%', padding: '14px 16px', background: 'rgba(0,0,0,0.2)', border: `1px solid ${V.bdr}`,
                                    borderRadius: '12px', color: V.txt, fontSize: '15px', outline: 'none'
                                }}
                            />
                        </div>
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', fontSize: '14px', color: V.txtM, marginBottom: '8px' }}>
                                <Key size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }}/> Page Access Token
                            </label>
                            <input 
                                type="text" 
                                value={pageToken}
                                onChange={(e) => setPageToken(e.target.value)}
                                placeholder="EAA..."
                                required
                                style={{
                                    width: '100%', padding: '14px 16px', background: 'rgba(0,0,0,0.2)', border: `1px solid ${V.bdr}`,
                                    borderRadius: '12px', color: V.txt, fontSize: '15px', outline: 'none'
                                }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button 
                                type="button"
                                onClick={() => setShowManual(false)}
                                style={{
                                    flex: '1', padding: '14px', background: 'transparent', color: V.txt, border: `1px solid ${V.bdr}`,
                                    borderRadius: '12px', fontSize: '15px', cursor: 'pointer'
                                }}
                            >
                                ยกเลิก
                            </button>
                            <button 
                                type="submit"
                                disabled={loading}
                                style={{
                                    flex: '1', padding: '14px', background: V.pri, color: '#000', border: 'none',
                                    borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                }}
                            >
                                {loading ? <Loader2 size={18} className="animate-spin" /> : 'บันทึกเพจ'}
                            </button>
                        </div>
                    </form>
                )}

                <div style={{
                    marginTop: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    color: V.txtS,
                    fontSize: '13px',
                    padding: '16px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '12px'
                }}>
                    <ShieldCheck size={18} style={{ color: V.ok }} />
                    ระบบจัดเก็บข้อมูลอย่างปลอดภัยตามมาตรฐานความปลอดภัย
                </div>
            </div>

            <style>{`
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                
                .gs-logo-3d-wrapper {
                    position: relative;
                    width: 100px;
                    height: 100px;
                    margin: 10px auto;
                    transition: transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
                    transform-style: preserve-3d;
                    z-index: 10;
                }
                .gs-ultimate-logo-container:hover .gs-logo-3d-wrapper {
                    transform: rotateX(15deg) rotateY(15deg) scale(1.05);
                }

                .gs-orbit-ring {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    border: 1.5px solid ${V.pri}40;
                    border-radius: 50%;
                    transform-style: preserve-3d;
                    pointer-events: none;
                }
                .gs-orbit-1 {
                    width: 130px;
                    height: 130px;
                    margin-left: -65px;
                    margin-top: -65px;
                    animation: gs-orbit-rotate-1 8s linear infinite;
                    border-top-color: ${V.pri};
                }
                .gs-orbit-2 {
                    width: 150px;
                    height: 150px;
                    margin-left: -75px;
                    margin-top: -75px;
                    animation: gs-orbit-rotate-2 12s linear infinite;
                    border-bottom-color: ${V.pri};
                }

                .gs-sparkle {
                    position: absolute;
                    width: 4px;
                    height: 4px;
                    background: ${V.pri};
                    border-radius: 50%;
                    box-shadow: 0 0 10px ${V.pri};
                    animation: gs-sparkle-anim 3s infinite;
                    opacity: 0;
                }
                .s1 { top: 20%; left: 10%; animation-delay: 0s; }
                .s2 { top: 70%; left: 85%; animation-delay: 1s; }
                .s3 { top: 10%; left: 80%; animation-delay: 2s; }

                @keyframes gs-orbit-rotate-1 {
                    from { transform: rotateX(70deg) rotateY(0deg) rotateZ(0deg); }
                    to { transform: rotateX(70deg) rotateY(360deg) rotateZ(360deg); }
                }
                @keyframes gs-orbit-rotate-2 {
                    from { transform: rotateX(-60deg) rotateY(0deg) rotateZ(360deg); }
                    to { transform: rotateX(-60deg) rotateY(360deg) rotateZ(0deg); }
                }
                @keyframes gs-sparkle-anim {
                    0%, 100% { transform: scale(0); opacity: 0; }
                    50% { transform: scale(1); opacity: 1; }
                }

                @keyframes gs-glow-pulse {
                    0%, 100% { transform: scale(1); opacity: 0.4; filter: blur(10px); }
                    50% { transform: scale(1.2); opacity: 0.7; filter: blur(15px); }
                }
                
                @media (max-width: 480px) {
                    .gs-connect-container { padding: 15px !important; }
                    .gs-connect-card { padding: 35px 20px !important; border-radius: 20px !important; }
                    .gs-ultimate-logo-container { transform: scale(0.8); margin-bottom: 10px !important; }
                    .gs-connect-title { font-size: 22px !important; }
                    .gs-connect-btn { height: 52px !important; font-size: 15px !important; }
                    .gs-orbit-ring { display: none; } /* Hide rings on mobile to reduce clutter */
                }
            `}</style>
        </div>
    );
}

export default ConnectFacebook;
