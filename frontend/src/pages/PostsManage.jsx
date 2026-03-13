import { useState, useEffect } from 'react';
import { Send, Clock, CheckCircle2, XCircle, Trash2, ExternalLink, Image as ImageIcon, MessageSquare, User, BookOpen, History, RefreshCw, AlertCircle, Calendar, Globe } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { V } from '../theme';

function PostsManage() {
    const { onLogout } = useOutletContext();
    const [posts, setPosts] = useState([]);
    const [pages, setPages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all');
    const [pageFilter, setPageFilter] = useState('all');

    const fetchData = async () => {
        try {
            const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
            const [postsRes, pagesRes] = await Promise.all([
                fetch('/api/posts', { headers }),
                fetch('/api/pages', { headers })
            ]);

            if (postsRes.status === 401 || pagesRes.status === 401) {
                onLogout();
                return;
            }

            let postsData = [];
            let pagesData = [];

            try { postsData = await postsRes.json(); } catch (e) { }
            try { pagesData = await pagesRes.json(); } catch (e) { }

            if (postsRes.ok) setPosts(Array.isArray(postsData) ? postsData : []);
            else setError(postsData.error || 'Failed to fetch posts');

            if (pagesRes.ok) setPages(Array.isArray(pagesData) ? pagesData : []);
        } catch (err) {
            setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000); // Auto refresh every 30s
        return () => clearInterval(interval);
    }, []);

    const handlePostNow = async (id) => {
        if (!window.confirm('ยืนยันการโพสต์ทันที?')) return;
        try {
            const res = await fetch(`/api/posts/${id}/post-now`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });

            if (res.status === 401) {
                onLogout();
                return;
            }

            if (res.ok) fetchData();
            else alert('โพสต์ไม่สำเร็จ');
        } catch (err) {
            alert('เกิดข้อผิดพลาด');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('ยืนยันการลบประวัตินี้?')) return;
        try {
            await fetch(`/api/posts/${id}`, {
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

    const filteredPosts = posts.filter(p => {
        const matchesStatus = filter === 'all' || p.status === filter;
        const matchesPage = pageFilter === 'all' || p.page_id === pageFilter;
        return matchesStatus && matchesPage;
    });

    if (loading) return (
        <div className="adm-center">
            <div className="adm-spin">
                <History size={40} />
            </div>
        </div>
    );

    const selectedPageName = pageFilter === 'all' ? 'ทุกเพจ' : pages.find(p => p.page_id === pageFilter)?.page_name || 'เพจที่ถูกเลือก';

    return (
        <div className="adm fade-in">
            {/* Header Area */}
            <div className="adm-header">
                <div className="adm-header-l">
                    <div className="adm-header-icon">
                        <History size={32} />
                    </div>
                    <div>
                        <h1>ประวัติการโพสต์</h1>
                        <p>ติดตามและจัดการสถานะการโพสต์ทั้งหมดที่เกิดขึ้นในระบบ</p>
                    </div>
                </div>
                <div className="adm-header-actions" style={{ gap: '12px', flexWrap: 'wrap' }}>
                    {/* Page Filter Dropdown */}
                    <div style={{ position: 'relative', minWidth: '220px' }}>
                        <select
                            className="adm-select"
                            style={{
                                padding: '10px 16px',
                                paddingLeft: '40px',
                                fontSize: '13px',
                                fontWeight: '700',
                                color: V.priL
                            }}
                            value={pageFilter}
                            onChange={(e) => setPageFilter(e.target.value)}
                        >
                            <option value="all">🌐 ทุกเพจ Facebook</option>
                            {pages.map(p => (
                                <option key={p.id} value={p.page_id}>📄 {p.page_name}</option>
                            ))}
                        </select>
                        <Globe size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: V.pri, opacity: 0.6 }} />
                    </div>

                    <div style={{ display: 'flex', background: V.bgDark, padding: '4px', borderRadius: '12px', border: `1px solid ${V.bdr}` }}>
                        {['all', 'success', 'pending', 'failed'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                style={{
                                    padding: '6px 14px',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    border: 'none',
                                    background: filter === f ? V.pri : 'transparent',
                                    color: filter === f ? '#1a1200' : V.txtM,
                                    textTransform: 'uppercase',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    <button className="adm-btn-refresh" onClick={fetchData} style={{ padding: '10px' }}>
                        <RefreshCw size={18} />
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

            {/* Posts List Section */}
            <div className="adm-panel">
                <div className="adm-panel-head">
                    <div className="adm-panel-title">
                        <Send size={18} />
                        รายการโพสต์: {selectedPageName} ({filter.toUpperCase()}) — {filteredPosts.length} รายการ
                    </div>
                </div>

                <div className="adm-form" style={{ padding: '24px' }}>
                    {filteredPosts.length === 0 ? (
                        <div className="bm-empty" style={{ padding: '60px' }}>
                            <Send size={48} opacity={0.2} />
                            <p>ไม่มีประวัติการส่งโพสต์ในขณะนี้</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {filteredPosts.map(post => (
                                <div key={post.id} className="adm-card" style={{
                                    padding: '18px',
                                    display: 'grid',
                                    gridTemplateColumns: 'auto 1fr auto',
                                    gap: '20px',
                                    alignItems: 'center'
                                }}>
                                    {/* Image/Icon Box */}
                                    <div style={{
                                        width: '64px',
                                        height: '64px',
                                        borderRadius: '14px',
                                        background: V.bgDark,
                                        border: `1px solid ${V.bdr}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        overflow: 'hidden',
                                        flexShrink: 0,
                                        position: 'relative'
                                    }}>
                                        {post.image_url ? (
                                            (() => {
                                                let urls = [];
                                                try {
                                                    urls = JSON.parse(post.image_url);
                                                } catch (e) {
                                                    urls = [post.image_url];
                                                }

                                                const primaryUrl = Array.isArray(urls) ? urls[0] : post.image_url;
                                                const isMultiple = Array.isArray(urls) && urls.length > 1;

                                                return (
                                                    <>
                                                        <img src={primaryUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        {isMultiple && (
                                                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }}>
                                                                <ImageIcon size={16} color={V.pri} />
                                                                <span style={{ position: 'absolute', bottom: '2px', right: '4px', fontSize: '10px', fontWeight: '800', color: V.pri }}>{urls.length}</span>
                                                            </div>
                                                        )}
                                                    </>
                                                );
                                            })()
                                        ) : (
                                            <MessageSquare size={28} color={V.txtM} />
                                        )}
                                    </div>

                                    {/* Post Details */}
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                            <h4 style={{ fontSize: '15px', fontWeight: '800', color: V.priL, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {post.message || '(ไม่มีข้อความโพสต์)'}
                                            </h4>
                                            <div className={`adm-badge ${post.status === 'success' ? 'lottery' : post.status === 'pending' ? 'default' : 'promotion'}`}>
                                                {post.status.toUpperCase()}
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '11px', color: V.txtM }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Globe size={13} /> {post.page_name}</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div className="adm-tag">TEMPLATE</div> {post.template_name}</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                <Calendar size={13} />
                                                {post.schedule_time ?
                                                    `ตั้งเวลา: ${new Date(post.schedule_time).toLocaleString('th-TH')}` :
                                                    `ส่งเมื่อ: ${new Date(post.created_at).toLocaleString('th-TH')}`
                                                }
                                            </div>
                                        </div>

                                        {post.error_message && (
                                            <div style={{
                                                marginTop: '10px',
                                                fontSize: '11px',
                                                color: V.err,
                                                background: 'rgba(224, 85, 85, 0.05)',
                                                padding: '8px 12px',
                                                borderRadius: '8px',
                                                border: '1px solid rgba(224, 85, 85, 0.1)'
                                            }}>
                                                <AlertCircle size={12} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                                                Error: {post.error_message}
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        {post.status === 'pending' && (
                                            <button
                                                onClick={() => handlePostNow(post.id)}
                                                className="adm-btn-pick"
                                                style={{ height: '36px', fontSize: '12px' }}
                                            >
                                                โพสต์ทันที
                                            </button>
                                        )}
                                        {post.fb_post_id && (
                                            <a
                                                href={`https://facebook.com/${post.fb_post_id}`}
                                                target="_blank"
                                                style={{ textDecoration: 'none' }}
                                            >
                                                <button className="adm-btn-ghost" style={{ width: '36px', height: '36px', padding: 0 }}>
                                                    <ExternalLink size={16} />
                                                </button>
                                            </a>
                                        )}
                                        <button
                                            onClick={() => handleDelete(post.id)}
                                            className="adm-btn-del"
                                            style={{ width: '36px', height: '36px' }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
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

export default PostsManage;
