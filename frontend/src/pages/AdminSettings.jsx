import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, AlertTriangle, ShieldCheck, Loader2, Database, Shield, Activity } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { V } from '../theme';

function AdminSettings() {
    const { onLogout } = useOutletContext();
    const [blacklist, setBlacklist] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/settings', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });

            if (res.status === 401) {
                onLogout();
                return;
            }

            const data = await res.json();
            if (res.ok) setBlacklist(data.blacklist || '');
        } catch (error) {
            setMessage({ type: 'error', text: 'ไม่สามารถโหลดข้อมูลได้' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ key: 'blacklist', value: blacklist })
            });

            if (res.status === 401) {
                onLogout();
                return;
            }

            if (res.ok) {
                setMessage({ type: 'success', text: 'บันทึกการตั้งค่าคำต้องห้ามเรียบร้อยแล้ว' });
            } else {
                const data = await res.json();
                setMessage({ type: 'error', text: data.error || 'บันทึกไม่สำเร็จ' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการเชื่อมต่อ' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="adm-center">
            <div className="adm-spin">
                <SettingsIcon size={40} />
            </div>
        </div>
    );

    return (
        <div className="adm fade-in">
            {/* Header Area */}
            <div className="adm-header">
                <div className="adm-header-l">
                    <div className="adm-header-icon">
                        <ShieldCheck size={32} />
                    </div>
                    <div>
                        <h1>ตั้งค่าระบบหลัก</h1>
                        <p>จัดการความปลอดภัย และกฎการคัดกรองคำต้องห้าม</p>
                    </div>
                </div>
                <div className="adm-header-actions">
                    <button className="adm-btn-ghost" onClick={fetchSettings}>
                        <Activity size={16} /> ตรวจสอบสถานะ
                    </button>
                    <button className="adm-btn-primary" onClick={handleSave} disabled={saving}>
                        {saving ? <Loader2 className="adm-spin" size={16} /> : <Save size={16} />}
                        บันทึกทั้งหมด
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>
                {/* Main Settings Panel */}
                <div className="adm-panel">
                    <div className="adm-panel-head">
                        <div className="adm-panel-title">
                            <Shield size={18} />
                            ความปลอดภัยและการตั้งค่า (Security & Rules)
                        </div>
                    </div>

                    <div className="adm-form" style={{ padding: '24px' }}>
                        {/* Word Blacklist Section */}
                        <div style={{ paddingTop: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                                <Shield size={18} color={V.pri} />
                                <h3 style={{ fontSize: '15px', fontWeight: '800', color: V.priL }}>ตัวคัดกรองคำต้องห้าม (Word Blacklist)</h3>
                            </div>

                            <div style={{
                                background: `${V.info}08`,
                                border: `1px solid ${V.info}20`,
                                padding: '16px',
                                borderRadius: '14px',
                                marginBottom: '24px',
                                display: 'flex',
                                gap: '16px',
                                alignItems: 'center'
                            }}>
                                <div style={{ color: V.info }}>
                                    <ShieldCheck size={32} />
                                </div>
                                <div>
                                    <h4 style={{ fontSize: '15px', fontWeight: '800', color: V.txt, marginBottom: '2px' }}>Smart Filtering System</h4>
                                    <p style={{ fontSize: '12px', color: V.txtM }}>ข้อความที่มีคำเหล่านี้จะไม่ถูกส่งไปยัง Facebook API เพื่อป้องกันการรีพอร์ตเพจ</p>
                                </div>
                            </div>

                            <div className="adm-fg">
                                <label style={{ marginBottom: '8px' }}>รายการคำต้องห้าม (คั่นด้วยเครื่องหมายจุลภาค ",")</label>
                                <textarea
                                    className="adm-ta"
                                    rows="12"
                                    style={{ background: V.bgDark, fontSize: '15px', lineHeight: '1.6' }}
                                    placeholder="เช่น คำหยาบคาย, เว็บพนัน, ชื่อคู่แข่ง, หรือคำต้องห้ามอื่นๆ..."
                                    value={blacklist}
                                    onChange={(e) => setBlacklist(e.target.value)}
                                />

                                <div style={{
                                    display: 'flex',
                                    gap: '10px',
                                    marginTop: '16px',
                                    padding: '12px',
                                    background: 'rgba(255,255,255,0.03)',
                                    borderRadius: '10px',
                                    border: `1px solid ${V.bdr}`
                                }}>
                                    <AlertTriangle size={16} style={{ color: V.warn, flexShrink: 0 }} />
                                    <p style={{ fontSize: '11px', color: V.txtD, lineHeight: 1.5 }}>
                                        <strong>ข้อแนะนำ:</strong> ระบบจะใช้ได้ทั้งภาษาไทยและอังกฤษแบบไม่แยกตัวพิมพ์เล็ก-ใหญ่ครับ
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="adm-form-footer" style={{ marginTop: '24px' }}>
                            <button type="submit" className="adm-btn-save" style={{ width: '100%' }} onClick={handleSave} disabled={saving}>
                                {saving ? <Loader2 className="adm-spin" size={18} /> : <Save size={18} />}
                                ยืนยันการเปลี่ยนแปลงข้อมูล
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sidebar Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="adm-panel">
                        <div className="adm-panel-head">
                            <div className="adm-panel-title">
                                <Database size={18} />
                                ข้อมูลระบบ
                            </div>
                        </div>
                        <div style={{ padding: '20px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {[
                                    { label: 'Version', value: 'v2.4.0-premium' },
                                    { label: 'Environment', value: 'Production' },
                                    { label: 'Encrypted Persistence', value: 'Enabled' },
                                    { label: 'Auto-Scaling', value: 'Active' }
                                ].map((item, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                        <span style={{ color: V.txtM }}>{item.label}</span>
                                        <span style={{ color: V.priL, fontWeight: '700' }}>{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="adm-card" style={{ borderStyle: 'dashed', textAlign: 'center', padding: '24px' }}>
                        <Activity size={32} color={V.pri} style={{ marginBottom: '12px' }} />
                        <h4 style={{ fontSize: '14px', fontWeight: '800', color: V.txt, marginBottom: '8px' }}>Security Metrics</h4>
                        <p style={{ fontSize: '11px', color: V.txtM, lineHeight: 1.6 }}>
                            ระบบรักษาความปลอดภัยถูกอัปเดตล่าสุดเมื่อ <br />
                            {new Date().toLocaleDateString('th-TH')}
                        </p>
                    </div>
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

export default AdminSettings;
