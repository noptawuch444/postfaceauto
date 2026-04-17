import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Copy, ExternalLink, Key, Calendar, Layout, AlertCircle, X, Globe, Database, KeyRound, Link as LinkIcon } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { V } from '../theme';

function TemplatesManage() {
    const { onLogout } = useOutletContext();
    const [templates, setTemplates] = useState([]);
    const [pages, setPages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [copyingId, setCopyingId] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        page_id: '',
        template_name: '',
        password: '',
        expire_date: '',
        slug: '',
        auto_reply_enabled: false,
        auto_reply_text: ''
    });

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
            const [tRes, pRes] = await Promise.all([
                fetch('/api/templates', { headers }),
                fetch('/api/pages', { headers })
            ]);

            if (tRes.status === 401 || pRes.status === 401) {
                onLogout();
                return;
            }

            let tData = [];
            let pData = [];

            try { tData = await tRes.json(); } catch (e) { }
            try { pData = await pRes.json(); } catch (e) { }

            if (tRes.ok) setTemplates(Array.isArray(tData) ? tData : []);
            else setError(tData.error || 'Failed to fetch templates');

            if (pRes.ok) setPages(Array.isArray(pData) ? pData : []);
        } catch (err) {
            setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCopy = (slug) => {
        const url = `${window.location.origin}/public/${slug}`;
        navigator.clipboard.writeText(url);
        setCopyingId(slug);
        setTimeout(() => setCopyingId(null), 2000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const method = editingTemplate ? 'PUT' : 'POST';
        const url = editingTemplate ? `/api/templates/${editingTemplate.id}` : '/api/templates';

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (res.status === 401) {
                onLogout();
                return;
            }

            const data = await res.json();
            if (res.ok) {
                setShowModal(false);
                setEditingTemplate(null);
                setFormData({ page_id: '', template_name: '', password: '', expire_date: '', slug: '', auto_reply_enabled: false, auto_reply_text: '' });
                fetchData();
            } else {
                alert(data.error);
            }
        } catch (err) {
            alert('บันทึกไม่สำเร็จ');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('ยืนยันการลบเทมเพลตนี้? ลิงก์สาธารณะจะใช้งานไม่ได้ทันที')) return;
        try {
            await fetch(`/api/templates/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });

            if (res.status === 401) {
                onLogout();
                return;
            }

            fetchData();
        } catch (err) {
            alert('ลบไม่สำเร็จ');
        }
    };

    if (loading) return (
        <div className="adm-center">
            <div className="adm-spin">
                <Layout size={40} />
            </div>
        </div>
    );

    return (
        <div className="adm fade-in">
            {/* Header Area */}
            <div className="adm-header">
                <div className="adm-header-l">
                    <div className="adm-header-icon">
                        <Layout size={32} />
                    </div>
                    <div>
                        <h1>จัดการเทมเพลต</h1>
                        <p>สร้าง Public Link สำหรับให้ผู้อื่นช่วยโพสต์ลงเพจด้วยพาสเวิร์ด</p>
                    </div>
                </div>
                <div className="adm-header-actions">
                    <button className="adm-btn-primary" onClick={() => { setEditingTemplate(null); setFormData({ page_id: '', template_name: '', password: '', expire_date: '', slug: '', auto_reply_enabled: false, auto_reply_text: '' }); setShowModal(true); }}>
                        <Plus size={18} /> สร้างเทมเพลตใหม่
                    </button>
                </div>
            </div>

            {error && (
                <div className="adm-toast err" style={{ position: 'static', transform: 'none', marginBottom: '24px', width: '100%' }}>
                    <AlertCircle size={20} />
                    {error}
                    <button onClick={fetchData} className="adm-btn-ghost" style={{ marginLeft: '12px', color: 'white', textDecoration: 'underline' }}>ลองใหม่</button>
                </div>
            )}

            {/* Template Grid */}
            <div className="adm-grid">
                {templates.length === 0 && (
                    <div className="bm-empty" style={{ gridColumn: '1/-1', padding: '80px' }}>
                        <Layout size={48} opacity={0.2} />
                        <p>ยังไม่มีเทมเพลตจัดเก็บในระบบ</p>
                        <small>กรุณาคลิกปุ่ม "สร้างเทมเพลตใหม่" เพื่อเริ่มใช้งาน</small>
                    </div>
                )}

                {templates.map(tpl => (
                    <div key={tpl.id} className="adm-card">
                        <div className="adm-card-head">
                            <div className="adm-badge lottery">{tpl.page_name}</div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={() => { setEditingTemplate(tpl); setFormData({ ...tpl, expire_date: tpl.expire_date.split('T')[0] }); setShowModal(true); }}
                                    className="adm-btn-edit"
                                    style={{ width: '32px', height: '32px', padding: 0 }}
                                ><Edit2 size={14} /></button>
                                <button
                                    onClick={() => handleDelete(tpl.id)}
                                    className="adm-btn-del"
                                    style={{ width: '32px', height: '32px', padding: 0 }}
                                ><Trash2 size={14} /></button>
                            </div>
                        </div>

                        <div className="adm-card-info">
                            <h3 style={{ fontSize: '18px', fontWeight: '800', color: V.priL }}>{tpl.template_name}</h3>
                            <div className="adm-card-meta">
                                <div className="adm-meta-item">
                                    <KeyRound size={14} /> Password: <code style={{ color: V.pri, background: V.bgDark, padding: '2px 6px', borderRadius: '4px' }}>{tpl.password}</code>
                                </div>
                                <div className="adm-meta-item">
                                    <Calendar size={14} /> หมดอายุ: {new Date(tpl.expire_date).toLocaleDateString('th-TH')}
                                </div>
                                <div className="adm-meta-item" style={{ color: tpl.auto_reply_enabled ? V.ok : V.priD }}>
                                    <AlertCircle size={14} /> ระบบตอบกลับอัตโนมัติ: {tpl.auto_reply_enabled ? 'เปิดใช้งาน' : 'ปิดอยู่'}
                                </div>
                            </div>
                        </div>

                        <div className="adm-link-box">
                            <div className="adm-link-label">
                                <LinkIcon size={10} /> Public Link สำหรับแอดมิน
                            </div>
                            <div className="adm-link-row">
                                <code style={{ background: 'transparent', padding: 0 }}>/public/{tpl.slug}</code>
                                <div className="adm-link-actions">
                                    <button
                                        onClick={() => handleCopy(tpl.slug)}
                                        style={{ color: copyingId === tpl.slug ? V.ok : V.pri }}
                                    >
                                        <Copy size={14} />
                                    </button>
                                    <a href={`/public/${tpl.slug}`} target="_blank" style={{ textDecoration: 'none' }}>
                                        <button><ExternalLink size={14} /></button>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal Form */}
            {showModal && (
                <div className="adm-overlay">
                    <div className="adm-modal" style={{ maxWidth: '480px' }}>
                        <div className="adm-modal-head">
                            <h3>
                                <Layout size={20} />
                                {editingTemplate ? 'แก้ไขข้อมูลเทมเพลต' : 'สร้างเทมเพลตชุดใหม่'}
                            </h3>
                            <button className="adm-modal-close" onClick={() => setShowModal(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="adm-form">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '10px 0' }}>
                                {!editingTemplate && (
                                    <div className="adm-fg">
                                        <label><Globe size={14} /> เลือกเพจหลัก*</label>
                                        <select
                                            className="adm-input"
                                            value={formData.page_id}
                                            onChange={e => setFormData({ ...formData, page_id: e.target.value })}
                                            required
                                        >
                                            <option value="">-- กรุณาเลือกเพจ Facebook --</option>
                                            {pages.map(p => <option key={p.id} value={p.page_id}>{p.page_name}</option>)}
                                        </select>
                                    </div>
                                )}

                                <div className="adm-fg">
                                    <label><Database size={14} /> ชื่อชุดเทมเพลต*</label>
                                    <input
                                        className="adm-input"
                                        placeholder="เช่น โพสต์สำหรับทีมยิงแอด"
                                        value={formData.template_name}
                                        onChange={e => setFormData({ ...formData, template_name: e.target.value })}
                                        required
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div className="adm-fg">
                                        <label><Key size={14} /> รหัสผ่าน*</label>
                                        <input
                                            className="adm-input"
                                            placeholder="Password"
                                            value={formData.password}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="adm-fg">
                                        <label><LinkIcon size={14} /> URL Slug*</label>
                                        <input
                                            className="adm-input"
                                            placeholder="custom-link"
                                            value={formData.slug}
                                            onChange={e => setFormData({ ...formData, slug: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="adm-fg">
                                    <label><Calendar size={14} /> กำหนดวันหมดอายุ*</label>
                                    <input
                                        type="date"
                                        className="adm-input"
                                        value={formData.expire_date}
                                        onChange={e => setFormData({ ...formData, expire_date: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="adm-fg" style={{ background: V.bgL, padding: '16px', borderRadius: '12px', border: `1px solid ${V.pri}20` }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontWeight: '800', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <AlertCircle size={14} color={formData.auto_reply_enabled ? V.ok : V.pri} />
                                                ระบบตอบกลับคอมเมนต์อัตโนมัติ
                                            </span>
                                            <small style={{ opacity: 0.6, fontSize: '12px' }}>เปิด/ปิดระบบตอบกลับอัตโนมัติสำหรับเทมเพลตนี้</small>
                                        </div>
                                        <label className="gs-switch">
                                            <input
                                                type="checkbox"
                                                checked={formData.auto_reply_enabled}
                                                onChange={e => setFormData({ ...formData, auto_reply_enabled: e.target.checked })}
                                            />
                                            <span className="gs-slider"></span>
                                        </label>
                                    </div>

                                    {formData.auto_reply_enabled && (
                                        <div className="fade-in" style={{ marginTop: '12px', padding: '10px 12px', background: 'rgba(201,168,76,0.06)', borderRadius: '8px', border: '1px solid rgba(201,168,76,0.12)' }}>
                                            <p style={{ fontSize: '12px', color: V.priL, margin: 0, lineHeight: '1.6' }}>
                                                💡 ข้อความตอบกลับตั้งค่าแยกในแต่ละโพสต์ได้ที่หน้า <strong style={{ color: V.pri }}>Public Link</strong> ตอนสร้างโพสต์
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="adm-form-footer">
                                <button type="button" className="adm-btn-clear" style={{ flex: 1 }} onClick={() => setShowModal(false)}>ยกเลิก</button>
                                <button type="submit" className="adm-btn-save" style={{ flex: 2 }}>
                                    {editingTemplate ? 'อัปเดตข้อมูล' : 'ยืนยันการตั้งค่า'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div >
            )
            }

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
                .gs-switch { position: relative; display: inline-block; width: 44px; height: 24px; }
                .gs-switch input { opacity: 0; width: 0; height: 0; }
                .gs-slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: ${V.pri}40; transition: .4s; border-radius: 24px; }
                .gs-slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
                input:checked + .gs-slider { background-color: ${V.ok}; }
                input:checked + .gs-slider:before { transform: translateX(20px); }
            `}</style>
        </div >
    );
}

export default TemplatesManage;
