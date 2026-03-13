import { useState, useEffect } from 'react';
import { Trash2, Plus, RefreshCw, AlertCircle, Info, Database, Globe, Calendar, ShieldCheck, Shield, AlertTriangle } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { V } from '../theme';

function PagesManage() {
    const { onLogout } = useOutletContext();
    const [pages, setPages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchPages = async () => {
        try {
            const res = await fetch('/api/pages', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });

            if (res.status === 401) {
                onLogout();
                return;
            }

            const data = await res.json();
            if (res.ok) setPages(data);
            else setError(data.error);
        } catch (err) {
            setError('ไม่สามารถดึงข้อมูลเพจได้');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPages();
    }, []);

    const calculateExpiry = (updatedAt) => {
        const lastUpdate = new Date(updatedAt || Date.now());
        const expiryDate = new Date(lastUpdate.getTime() + (60 * 24 * 60 * 60 * 1000));
        const today = new Date();
        const diffTime = expiryDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return {
            days: diffDays,
            percent: Math.max(0, Math.min(100, (diffDays / 60) * 100)),
            date: expiryDate.toLocaleDateString('th-TH')
        };
    };

    const handleDelete = async (id) => {
        if (!window.confirm('ยืนยันการลบการเชื่อมต่อเพจนี้? เทมเพลตที่เกี่ยวข้องจะถูกลบไปด้วย')) return;
        try {
            const res = await fetch(`/api/pages/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });

            if (res.status === 401) {
                onLogout();
                return;
            }

            if (res.ok) fetchPages();
        } catch (err) {
            alert('ลบไม่สำเร็จ');
        }
    };

    if (loading) return (
        <div className="adm-center">
            <div className="adm-spin">
                <Database size={40} />
            </div>
        </div>
    );

    return (
        <div className="adm fade-in">
            {/* Header Area */}
            <div className="adm-header">
                <div className="adm-header-l">
                    <div className="adm-header-icon">
                        <Globe size={32} />
                    </div>
                    <div>
                        <h1>จัดการเพจ Facebook</h1>
                        <p>รายการเพจทั้งหมดที่เชื่อมต่อเข้ากับระบบ Auto Post พร้อมตรวจสอบสถานะ Token</p>
                    </div>
                </div>
                <div className="adm-header-actions">
                    <a href="/connect-facebook" style={{ textDecoration: 'none' }}>
                        <button className="adm-btn-primary">
                            <Plus size={18} /> เชื่อมต่อเพจใหม่
                        </button>
                    </a>
                </div>
            </div>

            {error && (
                <div className="adm-toast err" style={{ position: 'static', transform: 'none', marginBottom: '24px', width: '100%' }}>
                    <AlertCircle size={20} />
                    {error}
                </div>
            )}

            {/* Page List Section */}
            <div className="adm-panel">
                <div className="adm-panel-head">
                    <div className="adm-panel-title">
                        <Database size={18} />
                        Connected Pages ({pages.length})
                    </div>
                    <button className="adm-btn-refresh" onClick={fetchPages}>
                        <RefreshCw size={16} />
                    </button>
                </div>

                <div className="adm-form" style={{ padding: '24px' }}>
                    {pages.length === 0 ? (
                        <div className="bm-empty" style={{ padding: '60px' }}>
                            <Globe size={48} opacity={0.2} />
                            <p>ยังไม่มีเพจจัดเก็บในระบบ</p>
                            <small>กรุณาคลิกปุ่ม "เชื่อมต่อเพจใหม่" เพื่อเริ่มใช้งาน</small>
                        </div>
                    ) : (
                        <div className="adm-grid">
                            {pages.map(page => {
                                const expiry = calculateExpiry(page.updated_at);
                                const statusColor = expiry.days > 30 ? V.ok : expiry.days > 7 ? V.warn : V.err;

                                return (
                                    <div key={page.id} className="adm-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div style={{
                                                width: '50px',
                                                height: '50px',
                                                borderRadius: '12px',
                                                background: `${statusColor}15`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: statusColor,
                                                border: `1px solid ${statusColor}30`
                                            }}>
                                                <ShieldCheck size={28} />
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '18px', fontWeight: '900', color: statusColor }}>{expiry.days} วัน</div>
                                                <div style={{ fontSize: '10px', color: V.txtM }}>Token Life</div>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 style={{ fontSize: '18px', fontWeight: '800', color: V.priL, marginBottom: '4px' }}>
                                                {page.page_name}
                                            </h3>
                                            <div style={{
                                                fontSize: '11px',
                                                color: V.txtM,
                                                background: V.bgDark,
                                                padding: '4px 8px',
                                                borderRadius: '6px',
                                                display: 'inline-block',
                                                fontFamily: 'monospace'
                                            }}>
                                                ID: {page.page_id}
                                            </div>
                                        </div>

                                        {/* Progressive Expiry Bar */}
                                        <div style={{ marginTop: '4px' }}>
                                            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden', marginBottom: '8px' }}>
                                                <div style={{
                                                    width: `${expiry.percent}%`,
                                                    height: '100%',
                                                    background: statusColor,
                                                    boxShadow: `0 0 10px ${statusColor}40`,
                                                    transition: 'width 1s ease-out'
                                                }} />
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: V.txtD }}>
                                                <span>อัปเดต: {new Date(page.updated_at || page.created_at).toLocaleDateString('th-TH')}</span>
                                                <span>หมดอายุ: {expiry.date}</span>
                                            </div>
                                        </div>

                                        {expiry.days <= 7 && (
                                            <div style={{ padding: '8px', background: `${V.err}10`, border: `1px solid ${V.err}20`, borderRadius: '8px', fontSize: '10px', color: V.err, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <AlertTriangle size={14} />
                                                <span>โปรดต่ออายุ Token เร็วๆ นี้ครับ</span>
                                            </div>
                                        )}

                                        <div style={{
                                            marginTop: 'auto',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            paddingTop: '16px',
                                            borderTop: `1px solid ${V.bdr}`
                                        }}>
                                            <div style={{ flex: 1, fontSize: '12px', color: V.txtM, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Calendar size={14} /> {new Date(page.created_at).toLocaleDateString('th-TH')}
                                            </div>
                                            <button
                                                onClick={() => handleDelete(page.id)}
                                                className="adm-btn-del"
                                                style={{ width: '36px', height: '36px' }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Info Box */}
            <div className="adm-card" style={{
                marginTop: '32px',
                background: 'rgba(91, 155, 213, 0.05)',
                borderColor: 'rgba(91, 155, 213, 0.2)',
                flexDirection: 'row',
                alignItems: 'center',
                gap: '16px'
            }}>
                <div style={{ color: V.info }}>
                    <Info size={24} />
                </div>
                <div style={{ fontSize: '13px', color: V.txtS, lineHeight: 1.5 }}>
                    <strong style={{ color: V.info, display: 'block', marginBottom: '2px' }}>ความปลอดภัยสูงสุด:</strong>
                    Page Access Token ทั้งหมดถูกเข้ารหัสและจัดเก็บไว้อย่างปลอดภัยบน Google Cloud SQL เซิร์ฟเวอร์เท่านั้น
                </div>
            </div>

            <style>{`
                .adm-panel { position: relative; }
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
            `}</style>
        </div>
    );
}

export default PagesManage;
