import { useState } from 'react';
import { Lock, Mail, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import GoldenSnow from '../components/GoldenSnow';
import { V } from '../theme';

function AdminLogin({ onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (res.ok) {
                onLogin(data.token);
            } else {
                setError(data.error || 'Login failed');
            }
        } catch (err) {
            setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ฐานข้อมูลได้');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="adm" style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            background: V.bgMain,
            position: 'relative',
            overflow: 'hidden',
            fontFamily: '"Prompt", sans-serif',
            color: V.txt
        }}>
            <GoldenSnow />
            <div className="adm-panel" style={{ width: '100%', maxWidth: '420px', padding: 0 }}>
                {/* Header with Gold Gradient */}
                <div className="adm-header" style={{
                    padding: '40px 30px',
                    textAlign: 'center',
                    background: 'linear-gradient(180deg, rgba(201, 168, 76, 0.1) 0%, transparent 100%)',
                    borderBottom: `1px solid ${V.bdr}`
                }}>
                    <div className="adm-logo" style={{
                        width: '72px',
                        height: '72px',
                        background: '#000',
                        border: `1.5px solid ${V.pri}`,
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: V.pri,
                        margin: '0 auto 20px',
                        boxShadow: `0 0 25px ${V.pri}50`,
                        overflow: 'hidden'
                    }}>
                        <img src="/GOLDSYNC.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    <h2 className="adm-title" style={{ fontSize: '26px', fontWeight: '800', color: V.priL, letterSpacing: '-0.5px' }}>GoldSync Admin</h2>
                    <p style={{ color: V.txtM, fontSize: '13px', marginTop: '6px' }}>ระบบจัดการหลังบ้านระดับพรีเมียม</p>
                </div>

                <div className="adm-content" style={{ padding: '30px' }}>
                    {error && (
                        <div className="adm-toast err" style={{ position: 'static', transform: 'none', marginBottom: '24px', width: '100%', justifyContent: 'center' }}>
                            <AlertCircle size={18} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="adm-form">
                        <div className="adm-fg">
                            <label><Mail size={14} /> อีเมลผู้ใช้งาน</label>
                            <input
                                type="email"
                                className="adm-input"
                                placeholder="admin@goldsync.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="adm-fg">
                            <label><Lock size={14} /> รหัสผ่านความปลอดภัย</label>
                            <input
                                type="password"
                                className="adm-input"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="adm-btn-primary"
                            style={{ width: '100%', justifyContent: 'center', height: '52px', marginTop: '10px' }}
                            disabled={loading}
                        >
                            {loading ? <Loader2 size={20} className="adm-spin" /> : 'ยืนยันเพื่อเข้าสู่ระบบ'}
                        </button>
                    </form>
                </div>

                <div style={{
                    padding: '20px',
                    textAlign: 'center',
                    fontSize: '11px',
                    color: V.txtD,
                    background: 'rgba(30, 30, 35, 0.9)',
                    borderTop: `1px solid ${V.bdr}`
                }}>
                    Protected by GoldSync Enterprise Security Layer
                </div>
            </div>

            <style>{`
                .adm-panel { 
                    position: relative; 
                    background: ${V.bgSec}; 
                    border-radius: 20px; 
                    border: 1px solid ${V.bdr};
                    box-shadow: 0 20px 50px rgba(0,0,0,0.6);
                    overflow: hidden;
                    z-index: 1001;
                }
                .adm-panel:before {
                    content: "";
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 3px;
                    background: linear-gradient(90deg, transparent, ${V.pri}, transparent);
                    z-index: 10;
                }
                @media (max-width: 480px) {
                    .adm { padding: 10px !important; }
                    .adm-panel { border-radius: 16px !important; width: 100% !important; margin: 0 10px !important; }
                    .adm-header { padding: 30px 20px !important; }
                    .adm-content { padding: 25px 20px !important; }
                    .adm-logo { width: 62px !important; height: 62px !important; margin-bottom: 16px !important; }
                    .adm-title { font-size: 22px !important; }
                }
            `}</style>
        </div>
    );
}

export default AdminLogin;
