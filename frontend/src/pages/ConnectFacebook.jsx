import React, { useState } from 'react';
import { Key, Hash, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { V } from '../theme';
import GoldenSnow from '../components/GoldenSnow';

function ConnectFacebook() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [pageId, setPageId] = useState('');
    const [pageToken, setPageToken] = useState('');
    const token = localStorage.getItem('token');
    const navigate = useNavigate();

    const handleConnect = async () => {
        if (!token) {
            navigate('/login');
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
        if (!token) {
            window.location.href = '/login';
            return;
        }
        
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
            setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: V.bgMain,
            padding: '20px',
            fontFamily: '"Prompt", sans-serif',
            color: V.txt,
            position: 'relative',
            overflow: 'hidden'
        }}>
            <GoldenSnow />
            <div style={{
                background: V.bgSec,
                padding: '40px',
                borderRadius: '20px',
                border: `1px solid ${V.bdr}`,
                width: '100%',
                maxWidth: '480px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                position: 'relative',
                zIndex: 10
            }}>
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: '700', color: V.pri, marginBottom: '8px' }}>
                        เพิ่มเพจเข้าระบบ
                    </h2>
                    <p style={{ color: V.txtM, fontSize: '14px' }}>
                        ดึงเพจทั้งหมดที่คุณเป็นแอดมิน หรือเพิ่มด้วยตัวเอง
                    </p>
                </div>

                {error && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', padding: '12px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                        <AlertCircle size={16} /> {error}
                    </div>
                )}
                
                {success && (
                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', padding: '12px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                        <AlertCircle size={16} /> {success}
                    </div>
                )}

                <div style={{ marginBottom: '30px' }}>
                    <button 
                        onClick={handleConnect}
                        disabled={loading}
                        style={{
                            width: '100%', padding: '16px', background: '#1877F2', color: '#fff', border: 'none',
                            borderRadius: '10px', fontSize: '16px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            transition: 'opacity 0.2s', opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading ? <Loader2 size={20} className="adm-spin" /> : 'ดึงเพจทั้งหมดจาก Facebook อัตโนมัติ'}
                    </button>
                    <p style={{ textAlign: 'center', fontSize: '12px', color: V.txtM, marginTop: '10px' }}>
                        *แนะนำสำหรับแอดมิน: ดึงทุกเพจที่คุณดูแลเข้ามาในระบบทันที
                    </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', color: V.txtM }}>
                    <div style={{ flex: 1, height: '1px', background: V.bdr }}></div>
                    <span style={{ padding: '0 15px', fontSize: '14px' }}>หรือเพิ่มทีละเพจ (Manual)</span>
                    <div style={{ flex: 1, height: '1px', background: V.bdr }}></div>
                </div>

                <form onSubmit={handleManualConnect}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontSize: '14px', color: V.txtM, marginBottom: '8px' }}>
                            <Hash size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }}/> 
                            Page ID (ตัวเลขรหัสเพจ)
                        </label>
                        <input 
                            type="text" 
                            value={pageId}
                            onChange={(e) => setPageId(e.target.value)}
                            placeholder="เช่น 1054326789..."
                            required
                            style={{
                                width: '100%', padding: '14px', background: V.bgMain, border: `1px solid ${V.bdr}`,
                                borderRadius: '10px', color: V.txt, fontSize: '15px', outline: 'none'
                            }}
                        />
                    </div>
                    
                    <div style={{ marginBottom: '30px' }}>
                        <label style={{ display: 'block', fontSize: '14px', color: V.txtM, marginBottom: '8px' }}>
                            <Key size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }}/> 
                            Page Access Token
                        </label>
                        <input 
                            type="text" 
                            value={pageToken}
                            onChange={(e) => setPageToken(e.target.value)}
                            placeholder="EAA..."
                            required
                            style={{
                                width: '100%', padding: '14px', background: V.bgMain, border: `1px solid ${V.bdr}`,
                                borderRadius: '10px', color: V.txt, fontSize: '15px', outline: 'none'
                            }}
                        />
                    </div>
                    
                    <button 
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%', padding: '16px', background: V.pri, color: '#000', border: 'none',
                            borderRadius: '10px', fontSize: '16px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            transition: 'opacity 0.2s', opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading ? <Loader2 size={20} className="adm-spin" /> : 'เชื่อมต่อเพจเข้าสู่ระบบ'}
                    </button>
                </form>

                <div style={{ marginTop: '24px', textAlign: 'center' }}>
                    <Link to="/admin/pages" style={{ color: V.txtM, textDecoration: 'none', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <ArrowLeft size={14} /> กลับไปหน้าจัดการเพจ
                    </Link>
                </div>
            </div>
            <style>{`
                .adm-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}

export default ConnectFacebook;
