import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Lock, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import PublicHeader from '../components/PublicHeader';
import GoldenSnow from '../components/GoldenSnow';
import PostFormSection from '../components/PostFormSection';
import HistorySection from '../components/HistorySection';
import FacebookPreviewModal from '../components/FacebookPreviewModal';
import CustomConfirmModal from '../components/CustomConfirmModal';
import { V } from '../theme';

function PublicPost() {
    const { slug } = useParams();
    const dateTimeInputRef = useRef(null);

    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [template, setTemplate] = useState(null);
    const [message, setMessage] = useState('');
    const [images, setImages] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [scheduleTime, setScheduleTime] = useState('');
    const [postNow, setPostNow] = useState(true);
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [history, setHistory] = useState([]);
    const [showPreview, setShowPreview] = useState(false);
    const [collapsedDates, setCollapsedDates] = useState({});
    const [expandedItems, setExpandedItems] = useState({});
    const [autoReplyEnabled, setAutoReplyEnabled] = useState(false);
    const [autoReplyText, setAutoReplyText] = useState('');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState(null);

    const fetchHistory = useCallback(async () => {
        if (!isVerified) return;
        try {
            const res = await fetch(`/api/public/${slug}/history`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            const data = await res.json();
            if (res.ok) setHistory(data);
        } catch (err) { console.error('History fetch failed'); }
    }, [isVerified, slug, password]);

    const handleVerify = async (e) => {
        e.preventDefault(); setVerifying(true); setError('');
        try {
            const res = await fetch(`/api/public/${slug}/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            const data = await res.json();
            if (res.ok) {
                setTemplate(data.template);
                setIsVerified(true);
                sessionStorage.setItem(`pw_${slug}`, password);
            } else {
                setError(data.error || 'รหัสผ่านไม่ถูกต้อง');
            }
        } catch (err) { setError('เกิดข้อผิดพลาดในการเชื่อมต่อ'); }
        finally { setVerifying(false); }
    };

    useEffect(() => {
        // Fetch public info (e.g. template name) before verification
        const fetchInfo = async () => {
            try {
                const res = await fetch(`/api/public/${slug}/info`);
                const data = await res.json();
                if (res.ok) {
                    setTemplate(prev => ({
                        ...prev,
                        template_name: data.template_name,
                        page_name: data.page_name,
                        page_picture: data.page_picture
                    }));
                }
            } catch (e) { console.error('Info fetch failed'); }
        };
        fetchInfo();

        const savedPw = sessionStorage.getItem(`pw_${slug}`);
        if (savedPw) {
            setPassword(savedPw);
            (async () => {
                setVerifying(true);
                try {
                    const res = await fetch(`/api/public/${slug}/verify`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ password: savedPw })
                    });
                    const data = await res.json();
                    if (res.ok) { setTemplate(data.template); setIsVerified(true); }
                } catch (e) { }
                setVerifying(false);
            })();
        }
    }, [slug]);

    useEffect(() => {
        if (isVerified) {
            fetchHistory();
            const iv = setInterval(fetchHistory, 15000);
            return () => clearInterval(iv);
        }
    }, [isVerified, fetchHistory]);

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        const remaining = 80 - images.length;
        const newFiles = files.slice(0, remaining);
        if (newFiles.length === 0) return;

        setImages(prev => [...prev, ...newFiles]);

        newFiles.forEach(file => {
            const r = new FileReader();
            r.onloadend = () => {
                setImagePreviews(prev => [...prev, {
                    src: r.result,
                    name: file.name,
                    size: (file.size / 1024).toFixed(1) + ' KB',
                    type: 'image'
                }]);
            };
            r.readAsDataURL(file);
        });
        e.target.value = '';
    };

    const removeImage = (idx) => {
        setImages(prev => prev.filter((_, i) => i !== idx));
        setImagePreviews(prev => prev.filter((_, i) => i !== idx));
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); setLoading(true); setError(''); setSuccess('');
        const fd = new FormData();
        fd.append('password', password); fd.append('message', message);
        images.forEach(img => fd.append('images', img));
        fd.append('post_now', postNow);
        if (!postNow && scheduleTime) {
            // Convert local time to UTC ISO string for consistent server handling
            const utcTime = new Date(scheduleTime).toISOString();
            fd.append('schedule_time', utcTime);
        }
        if (autoReplyEnabled && autoReplyText) fd.append('auto_reply_text', autoReplyText);
        try {
            const res = await fetch(`/api/public/${slug}/post`, { method: 'POST', body: fd });
            const data = await res.json();
            if (res.ok) {
                setSuccess(data.message);
                setMessage('');
                setImages([]);
                setImagePreviews([]);
                setScheduleTime('');
                setAutoReplyEnabled(false);
                setAutoReplyText('');
                fetchHistory();
            } else {
                setError(data.error || 'ส่งข้อมูลไม่สำเร็จ');
            }
        } catch (err) { setError('เกิดข้อผิดพลาดในการส่งข้อมูล'); }
        finally { setLoading(false); }
    };

    const groupedHistory = useMemo(() => {
        const groups = {};
        history.forEach(item => {
            const d = item.schedule_time ? new Date(item.schedule_time) : new Date(item.created_at);
            const key = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
            if (!groups[key]) groups[key] = [];
            groups[key].push(item);
        });
        return Object.entries(groups);
    }, [history]);

    const toggleExpand = (itemId) => {
        if (!itemId) return;
        setExpandedItems(prev => ({ ...prev, [itemId]: !prev[itemId] }));
    };

    const handleClear = () => {
        setMessage(''); setImages([]); setImagePreviews([]); setScheduleTime('');
        setPostNow(true); setError(''); setSuccess('');
        setAutoReplyEnabled(false); setAutoReplyText('');
    };

    const handleDeleteHistory = (postId) => {
        setPendingDeleteId(postId);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!pendingDeleteId) return;
        setIsDeleteModalOpen(false);
        try {
            const res = await fetch(`/api/public/${slug}/history/delete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password, postId: pendingDeleteId })
            });

            if (res.status === 404) {
                setError('เกิดข้อผิดพลาด: ไม่พบที่อยู่สำหรับลบรายการ (โปรดตรวจสอบว่า Deploy เสร็จสมบูรณ์แล้ว)');
                return;
            }

            const data = await res.json();
            if (data.success) {
                setSuccess('ลบรายการเรียบร้อยแล้ว!');
                fetchHistory();
            } else {
                setError(data.error || `เกิดข้อผิดพลาดจากเซิร์ฟเวอร์ (Status: ${res.status})`);
            }
        } catch (err) {
            console.error('Delete error:', err);
            setError('เกิดข้อผิดพลาดในการเชื่อมต่อเพื่อลบรายการ: ' + err.message);
        } finally {
            setPendingDeleteId(null);
        }
    };

    if (!isVerified) {
        return (
            <div className="gs-verify-container" style={{ background: V.bgMain, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Prompt", sans-serif', color: V.txt, position: 'relative', overflow: 'hidden' }}>
                <GoldenSnow />
                <div className="gs-verify-card" style={{ width: '100%', maxWidth: '420px', padding: '40px', background: V.bgSec, borderRadius: '20px', border: `1px solid ${V.bdr}`, boxShadow: '0 20px 50px rgba(0,0,0,0.6)', position: 'relative', zIndex: 1001 }}>
                    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                        <div className="gs-verify-logo" style={{
                            width: '72px',
                            height: '72px',
                            background: '#000',
                            border: `1.5px solid ${V.pri}`,
                            borderRadius: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 20px',
                            boxShadow: `0 0 25px ${V.pri}50`,
                            overflow: 'hidden'
                        }}>
                            <img src="/GOLDSYNC.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </div>
                        <h2 className="gs-verify-title" style={{ fontSize: '22px', fontWeight: '800', color: V.priL }}>ยืนยันรหัสผ่าน</h2>
                        {template?.template_name && (
                            <div style={{ marginTop: '10px' }}>
                                <div style={{ fontSize: '20px', fontWeight: '800', color: '#ffea00', textShadow: '0 2px 10px rgba(255,215,0,0.4)', letterSpacing: '0.5px' }}>{template.template_name}</div>
                            </div>
                        )}
                        <p style={{ color: V.txtS, fontSize: '14px', marginTop: '10px' }}>กรุณากรอกรหัสผ่านเพื่อเข้าใช้งานลิงก์นี้</p>
                    </div>
                    <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', color: V.txtS, marginBottom: '8px' }}>รหัสผ่าน</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="ป้อนรหัสผ่าน..."
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                    autoFocus
                                    style={{
                                        width: '100%',
                                        padding: '14px 48px 14px 16px',
                                        background: V.bgMain,
                                        border: `1px solid ${V.bdr}`,
                                        borderRadius: '10px',
                                        color: '#fff',
                                        fontSize: '14px',
                                        fontFamily: 'inherit',
                                        outline: 'none'
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: '12px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        color: V.txtS,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: '4px',
                                        transition: 'color 0.2s'
                                    }}
                                    onMouseOver={e => e.currentTarget.style.color = V.pri}
                                    onMouseOut={e => e.currentTarget.style.color = V.txtS}
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>
                        {error && <div style={{ color: V.err, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(224,85,85,0.1)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(224,85,85,0.2)' }}><AlertCircle size={16} /> {error}</div>}
                        <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', background: `linear-gradient(135deg, ${V.pri}, ${V.priD})`, border: 'none', borderRadius: '10px', color: V.bgMain, fontWeight: '800', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'transform 0.2s', boxShadow: '0 4px 15px rgba(201,168,76,0.3)' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
                            {loading ? <Loader2 className="animate-spin" size={20} /> : 'เข้าสู่หน้าโพสต์'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    if (!template) {
        return (
            <div style={{ background: V.bgMain, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 className="animate-spin" size={48} color={V.pri} />
            </div>
        );
    }

    return (
        <div className="gs-public-page" style={{ background: V.bgMain, minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: '"Prompt", sans-serif', color: V.txt, position: 'relative', overflow: 'hidden' }}>
            <GoldenSnow zIndex={500} />
            <PublicHeader template={template} />

            <div className="gs-content-wrapper" style={{
                flex: 1,
                padding: '24px 40px',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
                width: '100%',
                minHeight: 0,
                position: 'relative',
                zIndex: 1
            }}>
                <div className="gs-main-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', alignItems: 'stretch', position: 'relative', zIndex: 1, flex: 1, minHeight: 0 }}>
                    <PostFormSection
                        message={message} setMessage={setMessage}
                        imagePreviews={imagePreviews} handleImageChange={handleImageChange} removeImage={removeImage}
                        postNow={postNow} setPostNow={setPostNow}
                        scheduleTime={scheduleTime} setScheduleTime={setScheduleTime}
                        dateTimeInputRef={dateTimeInputRef}
                        handleSubmit={handleSubmit} loading={loading} error={error} success={success}
                        onPreview={() => setShowPreview(true)}
                        onClear={handleClear}
                        autoReplyEnabled={autoReplyEnabled} setAutoReplyEnabled={setAutoReplyEnabled}
                        autoReplyText={autoReplyText} setAutoReplyText={setAutoReplyText}
                        isAutoReplyEnabledInTemplate={template?.auto_reply_enabled}
                    />
                    <HistorySection
                        history={history}
                        groupedHistory={groupedHistory}
                        collapsedDates={collapsedDates}
                        setCollapsedDates={setCollapsedDates}
                        expandedItems={expandedItems}
                        toggleExpand={toggleExpand}
                        onDelete={handleDeleteHistory}
                        onPreview={handlePreviewHistory}
                    />
                </div>
            </div>

            <FacebookPreviewModal
                showPreview={showPreview}
                setShowPreview={closePreview}
                template={template}
                message={historyPreviewData ? historyPreviewData.message : message}
                imagePreviews={historyPreviewData ? historyPreviewData.imagePreviews : imagePreviews}
                postNow={historyPreviewData ? historyPreviewData.postNow : postNow}
                scheduleTime={historyPreviewData ? historyPreviewData.scheduleTime : (postNow ? null : scheduleTime)}
            />

            <CustomConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="ยืนยันการลบรายการ"
                message="คุณต้องการยกเลิกและลบรายการที่เลือกใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้"
            />

            <style>{`
                @keyframes gsPulse { 0% { transform:scale(1); opacity:1 } 50% { transform:scale(1.3); opacity:.5 } 100% { transform:scale(1); opacity:1 } }
                @keyframes fadeSlideIn { from { opacity:0; transform:translateY(-8px) } to { opacity:1; transform:translateY(0) } }
                @keyframes gsFadeIn { from { opacity:0 } to { opacity:1 } }
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.2); border-radius: 3px; }
                ::-webkit-scrollbar-thumb:hover { background: rgba(201,168,76,0.4); }

                @media (max-width: 480px) {
                    .gs-verify-container { padding: 15px !important; }
                    .gs-verify-card { padding: 30px 20px !important; border-radius: 16px !important; }
                    .gs-verify-logo { width: 64px !important; height: 64px !important; margin-bottom: 16px !important; }
                    .gs-verify-title { font-size: 20px !important; }
                    .gs-public-page { overflow-y: auto !important; }
                }
            `}</style>
        </div>
    );
}

export default PublicPost;
