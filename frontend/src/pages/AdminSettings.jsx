import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, AlertTriangle, ShieldCheck, Loader2, Database, Shield, Activity, AlertCircle, Users, Plus, Trash2, ExternalLink, Link } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { V } from '../theme';

function AdminSettings() {
    const { onLogout } = useOutletContext();
    const [blacklist, setBlacklist] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Groups state
    const [groups, setGroups] = useState([]);
    const [groupsLoading, setGroupsLoading] = useState(true);
    const [groupForm, setGroupForm] = useState({ name: '', url: '' });
    const [groupSaving, setGroupSaving] = useState(false);
    const [groupMsg, setGroupMsg] = useState({ type: '', text: '' });

    const authHeaders = () => ({ 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' });

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/settings', { headers: authHeaders() });
            if (res.status === 401) { onLogout(); return; }
            const data = await res.json();
            if (res.ok) setBlacklist(data.blacklist || '');
        } catch { setMessage({ type: 'error', text: 'ไม่สามารถโหลดข้อมูลได้' }); }
        finally { setLoading(false); }
    };

    const fetchGroups = async () => {
        setGroupsLoading(true);
        try {
            const res = await fetch('/api/settings/groups', { headers: authHeaders() });
            if (res.status === 401) { onLogout(); return; }
            const data = await res.json();
            if (res.ok) setGroups(Array.isArray(data) ? data : []);
        } catch { }
        finally { setGroupsLoading(false); }
    };

    useEffect(() => { fetchSettings(); fetchGroups(); }, []);

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        setSaving(true); setMessage({ type: '', text: '' });
        try {
            const res = await fetch('/api/settings', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ key: 'blacklist', value: blacklist }) });
            if (res.status === 401) { onLogout(); return; }
            if (res.ok) setMessage({ type: 'success', text: 'บันทึกการตั้งค่าคำต้องห้ามเรียบร้อยแล้ว' });
            else { const d = await res.json(); setMessage({ type: 'error', text: d.error || 'บันทึกไม่สำเร็จ' }); }
        } catch { setMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการเชื่อมต่อ' }); }
        finally { setSaving(false); }
    };

    const handleAddGroup = async () => {
        if (!groupForm.name.trim() || !groupForm.url.trim()) {
            setGroupMsg({ type: 'error', text: 'กรุณากรอกชื่อกลุ่มและ URL' }); return;
        }
        setGroupSaving(true); setGroupMsg({ type: '', text: '' });
        try {
            const res = await fetch('/api/settings/groups', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ name: groupForm.name, url: groupForm.url }) });
            const data = await res.json();
            if (res.ok) {
                setGroupForm({ name: '', url: '' });
                setGroupMsg({ type: 'success', text: `เพิ่มกลุ่ม "${data.group.name}" สำเร็จ` });
                fetchGroups();
            } else {
                setGroupMsg({ type: 'error', text: data.error || 'เพิ่มไม่สำเร็จ' });
            }
        } catch { setGroupMsg({ type: 'error', text: 'เกิดข้อผิดพลาด' }); }
        finally { setGroupSaving(false); }
    };

    const handleDeleteGroup = async (id, name) => {
        if (!window.confirm(`ลบกลุ่ม "${name}" ออกจากรายการ?`)) return;
        try {
            await fetch(`/api/settings/groups/${id}`, { method: 'DELETE', headers: authHeaders() });
            fetchGroups();
        } catch { }
    };

    if (loading) return (
        <div className="adm-center">
            <div className="adm-spin"><SettingsIcon size={40} /></div>
        </div>
    );

    return (
        <div className="adm fade-in">
            {/* Header Area */}
            <div className="adm-header">
                <div className="adm-header-l">
                    <div className="adm-header-icon"><ShieldCheck size={32} /></div>
                    <div>
                        <h1>ตั้งค่าระบบหลัก</h1>
                        <p>จัดการความปลอดภัย กลุ่ม Facebook และกฎการคัดกรองคำต้องห้าม</p>
                    </div>
                </div>
                <div className="adm-header-actions">
                    <button className="adm-btn-ghost" onClick={() => { fetchSettings(); fetchGroups(); }}>
                        <Activity size={16} /> ตรวจสอบสถานะ
                    </button>
                    <button className="adm-btn-primary" onClick={handleSave} disabled={saving}>
                        {saving ? <Loader2 className="adm-spin" size={16} /> : <Save size={16} />}
                        บันทึก Blacklist
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>

                {/* === Facebook Groups Panel === */}
                <div className="adm-panel" style={{ gridColumn: '1 / -1' }}>
                    <div className="adm-panel-head" style={{ borderBottom: '1px solid rgba(24,119,242,0.15)', background: 'rgba(24,119,242,0.04)' }}>
                        <div className="adm-panel-title" style={{ color: '#5b9bd5' }}>
                            <Users size={18} color="#1877f2" />
                            จัดการกลุ่ม Facebook สำหรับแชร์โพสต์
                        </div>
                    </div>

                    <div style={{ padding: '20px' }}>
                        {/* Info Banner */}
                        <div style={{ background: 'rgba(24,119,242,0.06)', border: '1px solid rgba(24,119,242,0.15)', padding: '12px 16px', borderRadius: '12px', marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                            <Users size={20} color="#1877f2" style={{ flexShrink: 0, marginTop: '2px' }} />
                            <div>
                                <div style={{ fontWeight: '800', fontSize: '13px', color: '#5b9bd5', marginBottom: '4px' }}>กลุ่มที่เพิ่มไว้จะปรากฏเป็น Checkbox ในหน้า Public</div>
                                <div style={{ fontSize: '12px', color: V.txtS, lineHeight: '1.6' }}>
                                    ผู้ใช้จะสามารถเลือกกลุ่มที่ต้องการแชร์โพสต์เข้าได้เลย — เพิ่ม URL กลุ่มจาก Facebook ของคุณที่ต้องการให้แสดงในระบบ
                                </div>
                            </div>
                        </div>

                        {/* Add Group Form */}
                        <div style={{ background: V.bgMain, borderRadius: '12px', padding: '16px', border: `1px solid ${V.bdr}`, marginBottom: '20px' }}>
                            <div style={{ fontSize: '13px', fontWeight: '700', color: V.priL, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Plus size={14} /> เพิ่มกลุ่มใหม่
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px', marginBottom: '10px' }}>
                                <input
                                    type="text"
                                    placeholder="ชื่อกลุ่ม (ตั้งเองได้)"
                                    value={groupForm.name}
                                    onChange={e => setGroupForm(f => ({ ...f, name: e.target.value }))}
                                    className="adm-inp"
                                    style={{ background: V.bgSec }}
                                />
                                <input
                                    type="text"
                                    placeholder="URL กลุ่ม: https://www.facebook.com/groups/..."
                                    value={groupForm.url}
                                    onChange={e => setGroupForm(f => ({ ...f, url: e.target.value }))}
                                    onKeyDown={e => e.key === 'Enter' && handleAddGroup()}
                                    className="adm-inp"
                                    style={{ background: V.bgSec }}
                                />
                            </div>
                            {groupMsg.text && (
                                <div style={{ padding: '8px 12px', borderRadius: '8px', marginBottom: '10px', fontSize: '12px', fontWeight: '700', background: groupMsg.type === 'success' ? 'rgba(94,189,114,0.1)' : 'rgba(224,85,85,0.1)', color: groupMsg.type === 'success' ? '#5ebd72' : '#e05555', border: `1px solid ${groupMsg.type === 'success' ? 'rgba(94,189,114,0.2)' : 'rgba(224,85,85,0.2)'}` }}>
                                    {groupMsg.text}
                                </div>
                            )}
                            <button
                                onClick={handleAddGroup}
                                disabled={groupSaving}
                                className="adm-btn-primary"
                                style={{ background: '#1877f2', borderColor: '#1877f2' }}
                            >
                                {groupSaving ? <Loader2 className="adm-spin" size={14} /> : <Plus size={14} />}
                                เพิ่มกลุ่ม
                            </button>
                        </div>

                        {/* Groups List */}
                        {groupsLoading ? (
                            <div style={{ textAlign: 'center', padding: '20px', color: V.txtS }}>
                                <Loader2 className="adm-spin" size={24} />
                            </div>
                        ) : groups.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '30px', opacity: 0.4 }}>
                                <Users size={36} style={{ color: V.txtS, marginBottom: '8px' }} />
                                <p style={{ fontSize: '13px', color: V.txtS, margin: 0 }}>ยังไม่มีกลุ่ม — เพิ่มกลุ่มแรกของคุณด้านบน</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ fontSize: '12px', color: V.txtS, marginBottom: '4px', fontWeight: '700' }}>
                                    {groups.length} กลุ่มในระบบ
                                </div>
                                {groups.map(g => (
                                    <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: V.bgMain, borderRadius: '10px', border: `1px solid rgba(24,119,242,0.15)` }}>
                                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(24,119,242,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <Users size={16} color="#1877f2" />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: '800', fontSize: '13px', color: V.txt }}>{g.name}</div>
                                            <div style={{ fontSize: '11px', color: '#5b9bd5', opacity: 0.8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.url}</div>
                                        </div>
                                        <a href={g.url} target="_blank" rel="noopener noreferrer" style={{ flexShrink: 0, padding: '6px 10px', background: 'rgba(24,119,242,0.08)', border: '1px solid rgba(24,119,242,0.2)', borderRadius: '8px', color: '#1877f2', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '700', textDecoration: 'none' }}>
                                            <ExternalLink size={12} /> เปิด
                                        </a>
                                        <button
                                            onClick={() => handleDeleteGroup(g.id, g.name)}
                                            style={{ flexShrink: 0, padding: '6px', background: 'none', border: 'none', color: 'rgba(224,85,85,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
                                            onMouseOver={e => e.currentTarget.style.color = '#e05555'}
                                            onMouseOut={e => e.currentTarget.style.color = 'rgba(224,85,85,0.4)'}
                                            title="ลบกลุ่มออกจากระบบ"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Settings Panel */}
                <div className="adm-panel">
                    <div className="adm-panel-head">
                        <div className="adm-panel-title">
                            <Shield size={18} />
                            คำต้องห้าม (Blacklist)
                        </div>
                    </div>

                    <div className="adm-form" style={{ padding: '24px' }}>
                        <div style={{ paddingTop: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                                <Shield size={18} color={V.pri} />
                                <h3 style={{ fontSize: '15px', fontWeight: '800', color: V.priL }}>ตัวคัดกรองคำต้องห้าม (Word Blacklist)</h3>
                            </div>

                            <div style={{ background: `${V.info}08`, border: `1px solid ${V.info}20`, padding: '16px', borderRadius: '14px', marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                                <div style={{ color: V.info }}><ShieldCheck size={32} /></div>
                                <div>
                                    <h4 style={{ fontSize: '15px', fontWeight: '800', color: V.txt, marginBottom: '2px' }}>Smart Filtering System</h4>
                                    <p style={{ fontSize: '12px', color: V.txtM }}>ข้อความที่มีคำเหล่านี้จะไม่ถูกส่งไปยัง Facebook API เพื่อป้องกันการรีพอร์ตเพจ</p>
                                </div>
                            </div>

                            <div className="adm-fg">
                                <label style={{ marginBottom: '8px' }}>รายการคำต้องห้าม (คั่นด้วยเครื่องหมายจุลภาค ",")</label>
                                <textarea
                                    className="adm-ta"
                                    rows="10"
                                    style={{ background: V.bgDark, fontSize: '15px', lineHeight: '1.6' }}
                                    placeholder="เช่น คำหยาบคาย, เว็บพนัน, ชื่อคู่แข่ง..."
                                    value={blacklist}
                                    onChange={(e) => setBlacklist(e.target.value)}
                                />
                                <div style={{ display: 'flex', gap: '10px', marginTop: '16px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: `1px solid ${V.bdr}` }}>
                                    <AlertTriangle size={16} style={{ color: V.warn, flexShrink: 0 }} />
                                    <p style={{ fontSize: '11px', color: V.txtD, lineHeight: 1.5 }}>
                                        <strong>ข้อแนะนำ:</strong> ระบบจะใช้ได้ทั้งภาษาไทยและอังกฤษแบบไม่แยกตัวพิมพ์เล็ก-ใหญ่ครับ
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="adm-form-footer" style={{ marginTop: '24px' }}>
                            {message.text && (
                                <div style={{ padding: '8px 12px', borderRadius: '8px', marginBottom: '12px', fontSize: '12px', fontWeight: '700', background: message.type === 'success' ? 'rgba(94,189,114,0.1)' : 'rgba(224,85,85,0.1)', color: message.type === 'success' ? '#5ebd72' : '#e05555' }}>
                                    {message.text}
                                </div>
                            )}
                            <button type="submit" className="adm-btn-save" style={{ width: '100%' }} onClick={handleSave} disabled={saving}>
                                {saving ? <Loader2 className="adm-spin" size={18} /> : <Save size={18} />}
                                บันทึก Blacklist
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
                                    { label: 'Groups Configured', value: `${groups.length} กลุ่ม` }
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
                    top: 0; left: 0; right: 0;
                    height: 3px;
                    background: linear-gradient(90deg, transparent, ${V.pri}, transparent);
                    z-index: 10;
                }
            `}</style>
        </div>
    );
}

export default AdminSettings;
