import { useState, useEffect } from 'react';
import { Users, FileText, Send, Clock, CheckCircle2, XCircle, AlertCircle, ArrowRight, LayoutDashboard, Database, Activity, History } from 'lucide-react';
import { Link, useOutletContext } from 'react-router-dom';
import { V } from '../theme';

function StatCard({ title, value, icon: Icon, color, subValue }) {
    return (
        <div className="adm-card" style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: `${color}10`,
                    color: color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `1px solid ${color}20`
                }}>
                    <Icon size={24} />
                </div>
                <div>
                    <p style={{ fontSize: '11px', color: V.txtM, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>{title}</p>
                    <h3 style={{ fontSize: '24px', fontWeight: '800', color: V.priL, lineHeight: 1 }}>{value}</h3>
                </div>
            </div>
            {subValue && (
                <div style={{
                    fontSize: '11px',
                    color: V.txtD,
                    background: 'rgba(255,255,255,0.03)',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    width: 'fit-content'
                }}>
                    {subValue}
                </div>
            )}
        </div>
    );
}

function Dashboard() {
    const { onLogout } = useOutletContext();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchStats = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/dashboard/stats', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });

            if (res.status === 401) {
                onLogout();
                return;
            }

            const data = await res.json();
            if (res.ok) {
                setStats(data);
            } else {
                setError(data.error || 'Failed to fetch dashboard statistics');
            }
        } catch (err) {
            setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ฐานข้อมูลได้');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    if (loading) return (
        <div className="adm-center" style={{ minHeight: '60vh' }}>
            <div className="adm-spin">
                <LayoutDashboard size={48} color={V.pri} />
            </div>
            <p style={{ marginTop: '20px', color: V.txtS }}>กำลังโหลดข้อมูลDashboard...</p>
        </div>
    );

    if (error || !stats) return (
        <div className="adm-center" style={{ minHeight: '60vh', background: 'rgba(224, 85, 85, 0.05)', borderRadius: '20px', border: `1px dashed ${V.err}40`, padding: '40px' }}>
            <AlertCircle size={48} color={V.err} />
            <h2 style={{ color: V.txt, marginTop: '20px', fontSize: '20px' }}>เกิดข้อผิดพลาดในการโหลดข้อมูล</h2>
            <p style={{ color: V.txtS, marginTop: '8px', maxWidth: '300px', textAlign: 'center' }}>{error || 'ไม่พบข้อมูลสถิติจากเซิร์ฟเวอร์'}</p>
            <button
                onClick={fetchStats}
                className="adm-btn-primary"
                style={{ marginTop: '24px' }}
            >
                ลองใหม่อีกครั้ง
            </button>
        </div>
    );

    return (
        <div className="adm fade-in">
            {/* Page Header */}
            <div className="adm-header">
                <div className="adm-header-l">
                    <div className="adm-header-icon">
                        <LayoutDashboard size={32} />
                    </div>
                    <div>
                        <h1>แผงควบคุมหลัก</h1>
                        <p>สรุปรายละเอียดการทำงานของระบบ GoldSync AutoBot วันนี้</p>
                    </div>
                </div>
                <div className="adm-header-actions">
                    <button className="adm-btn-ghost">
                        <Activity size={16} /> รายงานระบบ
                    </button>
                    <Link to="/admin/pages" style={{ textDecoration: 'none' }}>
                        <button className="adm-btn-primary">
                            <Database size={16} /> จัดการเพจ
                        </button>
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                <StatCard title="จำนวนเพจทั้งหมด" value={stats?.pages || 0} icon={Users} color={V.info} subValue="Connected Facebook Pages" />
                <StatCard title="เทมเพลตที่สร้าง" value={stats?.templates || 0} icon={FileText} color={V.pri} subValue="Predefined Message Templates" />
                <StatCard title="โพสต์สำเร็จวันนี้" value={stats?.posts?.success || 0} icon={CheckCircle2} color={V.ok} subValue={`${stats?.posts?.total || 0} Total Posts Created`} />
                <StatCard title="รอการดำเนินการ" value={stats?.posts?.pending || 0} icon={Clock} color={V.warn} subValue="Scheduled / Retrying" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                {/* Recent Activity List */}
                <div className="adm-panel">
                    <div className="adm-panel-head">
                        <div className="adm-panel-title">
                            <History size={18} />
                            รายการโพสต์ล่าสุด
                        </div>
                        <Link to="/admin/posts" style={{ textDecoration: 'none' }}>
                            <button className="adm-btn-pick">
                                ดูประวัติทั้งหมด <ArrowRight size={14} />
                            </button>
                        </Link>
                    </div>
                    <div className="adm-form" style={{ padding: '20px' }}>
                        {!stats?.recentPosts || stats.recentPosts.length === 0 ? (
                            <div className="bm-empty" style={{ padding: '40px' }}>
                                <Send size={40} opacity={0.2} color={V.pri} />
                                <p style={{ color: V.txtM }}>ยังไม่มีรายการโพสต์ในระบบ</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {stats.recentPosts.map(post => (
                                    <div key={post.id} className="adm-card" style={{
                                        padding: '14px',
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: '16px'
                                    }}>
                                        <div style={{
                                            width: '44px',
                                            height: '44px',
                                            borderRadius: '10px',
                                            background: V.bgDark,
                                            border: `1px solid ${V.bdr}`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            overflow: 'hidden',
                                            flexShrink: 0
                                        }}>
                                            {post.image_url ?
                                                <img src={post.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" /> :
                                                <FileText size={20} color={V.txtM} />
                                            }
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '14px', fontWeight: '700', color: V.txt, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {post.message || '(ไม่มีข้อความ)'}
                                            </div>
                                            <div style={{ fontSize: '11px', color: V.txtM, marginTop: '2px' }}>
                                                เพจ: {post.page_name} • <span style={{ color: V.pri }}>{post.template_name}</span>
                                            </div>
                                        </div>
                                        <div className={`adm-badge ${post.status === 'success' ? 'lottery' : post.status === 'pending' ? 'default' : 'promotion'}`}>
                                            {post.status === 'success' ? 'สำเร็จ' : post.status === 'pending' ? 'รอส่ง' : post.status}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* System Status Sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="adm-panel">
                        <div className="adm-panel-head">
                            <div className="adm-panel-title">
                                <Activity size={18} />
                                ระบบสถานะ
                            </div>
                        </div>
                        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {[
                                { label: 'Backend API', status: 'ok', value: 'Active' },
                                { label: 'Scheduler Core', status: 'ok', value: 'Running' },
                                { label: 'Database Node', status: 'ok', value: 'Connected' },
                                { label: 'FB Graph API', status: 'warn', value: 'Monitoring' }
                            ].map((s, i) => (
                                <div key={i} className="adm-quick-display">
                                    <div className={`adm-status-dot ${s.status}`} />
                                    <div className="adm-q-vals">
                                        <div className="adm-q-status">{s.label}</div>
                                        <div className="adm-q-range">{s.value}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="adm-panel">
                        <div className="adm-panel-head">
                            <div className="adm-panel-title">
                                <Activity size={18} />
                                สรุปการส่งโพสต์
                            </div>
                        </div>
                        <div style={{ padding: '20px' }}>
                            <div style={{ marginBottom: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px', fontWeight: '600' }}>
                                    <span style={{ color: V.ok }}>สำเร็จ ({stats?.posts?.success || 0})</span>
                                    <span style={{ color: V.txtM }}>{stats?.posts?.total || 0} ทั้งหมด</span>
                                </div>
                                <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden', display: 'flex' }}>
                                    <div style={{ height: '100%', background: V.ok, width: stats?.posts?.total ? `${((stats.posts.success || 0) / stats.posts.total) * 100}%` : '0%' }}></div>
                                    <div style={{ height: '100%', background: V.warn, width: stats?.posts?.total ? `${((stats.posts.pending || 0) / stats.posts.total) * 100}%` : '0%' }}></div>
                                    <div style={{ height: '100%', background: V.err, width: stats?.posts?.total ? `${((stats.posts.failed || 0) / stats.posts.total) * 100}%` : '0%' }}></div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                <div className="adm-tag" style={{ background: `${V.ok}15`, color: V.ok, borderColor: `${V.ok}30` }}>SUCCESS</div>
                                <div className="adm-tag" style={{ background: `${V.warn}15`, color: V.warn, borderColor: `${V.warn}30` }}>PENDING</div>
                                <div className="adm-tag" style={{ background: `${V.err}15`, color: V.err, borderColor: `${V.err}30` }}>FAILED</div>
                            </div>
                        </div>
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

export default Dashboard;
