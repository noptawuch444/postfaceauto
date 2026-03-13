import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

function FacebookCallback() {
    const [status, setStatus] = useState('loading');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const authStartedRef = useRef(false);

    useEffect(() => {
        if (authStartedRef.current) return;

        const params = new URLSearchParams(location.search);
        const code = params.get('code');

        if (!code) {
            setStatus('error');
            setError('ไม่พบรหัสการยืนยันตัวตนจาก Facebook');
            return;
        }

        authStartedRef.current = true;

        fetch(`/api/facebook/callback?code=${code}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setStatus('success');
                    setTimeout(() => navigate('/waiting'), 2000);
                } else {
                    setStatus('error');
                    // Check if the error is about the code being used (common issue with React StrictMode or refresh)
                    if (data.error && (data.error.includes('code has been used') || data.error.includes('used code'))) {
                        setError('รหัสนี้ถูกใช้งานไปแล้ว แต่ความพยายามครั้งแรกอาจสำเร็จ โปรดตรวจสอบหน้าถัดไป');
                    } else {
                        setError(data.error || 'การเชื่อมต่อล้มเหลว');
                    }
                }
            })
            .catch(() => {
                setStatus('error');
                setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
            });
    }, [location, navigate]);

    return (
        <div className="public-layout">
            <div className="gs-card" style={{ width: '100%', maxWidth: '400px', textAlign: 'center', padding: '48px' }}>
                {status === 'loading' && (
                    <>
                        <Loader2 size={48} className="animate-spin" style={{ color: 'var(--gs-blue)', margin: '0 auto 24px' }} />
                        <h3 style={{ fontSize: '20px', fontWeight: '700' }}>กำลังยืนยันตัวตน...</h3>
                        <p style={{ color: 'var(--gs-text-dim)', marginTop: '8px' }}>กรุณารอสักครู่ ระบบกำลังเชื่อมต่อเพจของคุณ</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <CheckCircle2 size={48} style={{ color: 'var(--gs-success)', margin: '0 auto 24px' }} />
                        <h3 style={{ fontSize: '20px', fontWeight: '700' }}>เชื่อมต่อสำเร็จ!</h3>
                        <p style={{ color: 'var(--gs-text-dim)', marginTop: '8px' }}>กำลังนำคุณไปยังหน้าถัดไป...</p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <XCircle size={48} style={{ color: 'var(--gs-danger)', margin: '0 auto 24px' }} />
                        <h3 style={{ fontSize: '20px', fontWeight: '700' }}>เกิดข้อผิดพลาด</h3>
                        <p style={{ color: 'var(--gs-danger)', marginTop: '8px', lineHeight: '1.5' }}>{error}</p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px' }}>
                            {error.includes('ถูกใช้งานไปแล้ว') && (
                                <button
                                    onClick={() => navigate('/waiting')}
                                    className="gs-btn gs-btn-primary"
                                    style={{ width: '100%', justifyContent: 'center' }}
                                >
                                    ดำเนินการต่อไปยังหน้ารอเจ้าหน้าที่ <ArrowRight size={18} />
                                </button>
                            )}

                            <button
                                onClick={() => navigate('/connect-facebook')}
                                className="gs-btn gs-btn-outline"
                                style={{ width: '100%', justifyContent: 'center', borderColor: 'var(--gs-danger)', color: 'var(--gs-danger)' }}
                            >
                                ลองใหม่อีกครั้ง
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default FacebookCallback;
