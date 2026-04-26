import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Edit3, Image as ImageIcon, Film, Send, Clock, Calendar, AlertCircle, CheckCircle2, Save, Eye, Trash2, Loader2, Sparkles, X } from 'lucide-react';
import { V } from '../theme';

// Premium auto-dismiss success toast
const SuccessToast = ({ message }) => {
    const [visible, setVisible] = useState(true);
    const [exiting, setExiting] = useState(false);
    const timerRef = useRef(null);

    useEffect(() => {
        setVisible(true);
        setExiting(false);
        timerRef.current = setTimeout(() => {
            setExiting(true);
            setTimeout(() => setVisible(false), 400);
        }, 4000);
        return () => clearTimeout(timerRef.current);
    }, [message]);

    const handleClose = () => {
        clearTimeout(timerRef.current);
        setExiting(true);
        setTimeout(() => setVisible(false), 400);
    };

    if (!visible) return null;

    return (
        <div style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(201,168,76,0.12), rgba(94,189,114,0.08))',
            border: '1px solid rgba(201,168,76,0.25)',
            padding: '14px 16px',
            animation: exiting ? 'toastSlideOut 0.4s ease-in forwards' : 'toastSlideIn 0.4s cubic-bezier(0.22,1,0.36,1) forwards',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 4px 20px rgba(201,168,76,0.1), inset 0 1px 0 rgba(255,255,255,0.05)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                    width: '32px', height: '32px', borderRadius: '10px',
                    background: 'linear-gradient(135deg, rgba(94,189,114,0.2), rgba(201,168,76,0.15))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid rgba(94,189,114,0.2)',
                    flexShrink: 0
                }}>
                    <img src="/GOLDSYNC.png" alt="Icon" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#e2c97e', marginBottom: '2px' }}>สำเร็จ!</div>
                    <div style={{ fontSize: '12px', color: 'rgba(94,189,114,0.9)' }}>{message}</div>
                </div>
                <button onClick={handleClose} style={{
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px', padding: '4px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'rgba(255,255,255,0.4)', transition: 'all 0.2s'
                }}
                    onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
                    onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
                >
                    <X size={14} />
                </button>
            </div>
            {/* Progress bar */}
            <div style={{
                position: 'absolute', bottom: 0, left: 0, height: '3px',
                background: 'linear-gradient(90deg, #c9a84c, #5ebd72, #c9a84c)',
                backgroundSize: '200% 100%',
                animation: `toastProgress 4s linear forwards, toastShimmer 1.5s ease-in-out infinite`,
                borderRadius: '0 0 12px 12px'
            }} />
        </div>
    );
};

const PostFormSection = ({
    message, setMessage,
    imagePreviews, handleImageChange, removeImage,
    postNow, setPostNow,
    scheduleTime, setScheduleTime,
    dateTimeInputRef,
    handleSubmit, loading, error, success,
    onPreview,
    onClear,
    autoReplyEnabled, setAutoReplyEnabled,
    autoReplyText, setAutoReplyText,
    isAutoReplyEnabledInTemplate
}) => {
    const inputStyle = {
        width: '100%', padding: '14px 16px', background: V.bgMain,
        border: `1px solid ${V.bdr}`, borderRadius: '10px',
        color: '#fff', fontSize: '14px', fontFamily: 'inherit', outline: 'none',
        transition: 'border-color 0.2s, box-shadow 0.2s'
    };

    const focusIn = (e) => { e.target.style.borderColor = V.pri; e.target.style.boxShadow = '0 0 0 3px rgba(201,168,76,0.1)'; };
    const focusOut = (e) => { e.target.style.borderColor = V.bdr; e.target.style.boxShadow = 'none'; };

    // Derived states for separate Date and Time inputs
    const splitTime = useMemo(() => {
        if (!scheduleTime) return { date: '', time: '' };
        const [d, t] = scheduleTime.split('T');
        return { date: d, time: t || '' };
    }, [scheduleTime]);

    const handleDateChange = (newDate) => {
        setScheduleTime(`${newDate}T${splitTime.time || '00:00'}`);
    };

    const handleTimeChange = (e) => {
        let val = e.target.value;
        val = val.replace(/[^0-9:]/g, '');
        if (val.length > 5) val = val.slice(0, 5);
        if (val.length === 2 && !val.includes(':')) val = val + ':';
        setScheduleTime(`${splitTime.date || new Date().toISOString().split('T')[0]}T${val}`);
    };

    // Helper to format date label (พ.ศ.)
    const getThaiDateLabel = (dateStr) => {
        if (!dateStr) return 'วันที่';
        const d = new Date(dateStr);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const beYear = d.getFullYear() + 543;
        return `${day}/${month}/${beYear}`;
    };

    return (
        <div className="gs-post-form-section" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            {/* Header matches HistorySection layout */}
            <div style={{ background: V.pri, padding: '14px 20px', borderRadius: '14px 14px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1a1200', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    <Edit3 size={16} /> <span className="gs-header-title">สร้างรายการใหม่</span>
                </h3>
                <button onClick={() => window.location.reload()} style={{ background: 'rgba(0,0,0,0.12)', border: 'none', color: 'rgba(0,0,0,0.5)', padding: '4px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>รีเฟรช</button>
            </div>

            {/* Scrollable body aligned to HistorySection height and style */}
            <div className="gs-card-body-scroll" style={{
                background: V.bgSec,
                border: `1px solid ${V.bdr}`,
                borderTop: 'none',
                borderRadius: '0 0 14px 14px',
                padding: '16px 20px',
                position: 'relative',
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                overflowX: 'hidden',
                height: '740px',
                maxHeight: '740px'
            }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative', zIndex: 1, minWidth: 0 }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', color: V.txtS, marginBottom: '8px' }}>ข้อความ <span style={{ opacity: 0.5 }}>({message.length} ตัวอักษร)</span></label>
                        <textarea rows="8" placeholder="พิมพ์ข้อความที่ต้องการส่ง..." value={message} onChange={e => setMessage(e.target.value)}
                            style={{ ...inputStyle, fontSize: '14px', lineHeight: '1.5', resize: 'none', padding: '16px' }} onFocus={focusIn} onBlur={focusOut} />
                    </div>

                    <div style={{ minHeight: 0, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: V.txt, marginBottom: '10px' }}>รูปภาพ <span style={{ color: V.txtS, fontWeight: '400', fontSize: '13px', marginLeft: '4px' }}>({imagePreviews.length}/80)</span></label>

                        {imagePreviews.length === 0 ? (
                            <div onClick={() => document.getElementById('img-up').click()}
                                style={{
                                    width: '100%', height: '100px', borderRadius: '16px',
                                    border: `2px dashed rgba(201, 168, 76, 0.35)`, cursor: 'pointer', background: 'rgba(201,168,76,0.02)',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={e => { e.currentTarget.style.borderColor = V.pri; e.currentTarget.style.background = 'rgba(201,168,76,0.06)'; }}
                                onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(201, 168, 76, 0.35)'; e.currentTarget.style.background = 'rgba(201,168,76,0.02)'; }}>
                                <ImageIcon size={24} style={{ color: V.pri }} />
                                <div style={{ fontSize: '13px', fontWeight: '700', color: V.txt }}>คลิกเพื่อเลือกรูปภาพ</div>
                            </div>
                        ) : (
                            <div className="gs-image-scroller" style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px' }}>
                                <div onClick={() => document.getElementById('img-up').click()}
                                    style={{ width: '100px', aspectRatio: '1', borderRadius: '12px', border: `1.5px dashed rgba(201,168,76,0.3)`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <ImageIcon size={24} style={{ color: V.txtS, opacity: 0.6 }} />
                                </div>
                                {imagePreviews.map((img, i) => (
                                    <div key={i} style={{ position: 'relative', width: '100px', aspectRatio: '1', borderRadius: '12px', background: '#0a0a0a', border: `1.5px solid ${V.bdr}`, overflow: 'hidden', flexShrink: 0 }}>
                                        <button type="button" onClick={() => removeImage(i)} style={{ position: 'absolute', top: '4px', right: '4px', width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(224,85,85,0.9)', border: 'none', color: '#fff', fontSize: '10px', cursor: 'pointer', zIndex: 10 }}>✕</button>
                                        <img src={img.src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                ))}
                            </div>
                        )}
                        <input id="img-up" type="file" hidden accept="image/*" multiple onChange={handleImageChange} />
                    </div>

                    <div style={{ display: 'flex', gap: '0', background: V.bgMain, borderRadius: '10px', border: `1px solid ${V.bdr}`, overflow: 'hidden' }}>
                        <button type="button" onClick={() => setPostNow(true)}
                            style={{ flex: 1, padding: '12px', border: 'none', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: postNow ? `linear-gradient(135deg, ${V.priD}, ${V.pri})` : 'transparent', color: postNow ? '#1a1200' : V.txtS }}>
                            <Send size={14} /> โพสต์ทันที
                        </button>
                        <button type="button" onClick={() => setPostNow(false)}
                            style={{ flex: 1, padding: '12px', border: 'none', borderLeft: `1px solid ${V.bdr}`, fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: !postNow ? `linear-gradient(135deg, ${V.priD}, ${V.pri})` : 'transparent', color: !postNow ? '#1a1200' : V.txtS }}>
                            <Clock size={14} /> ตั้งเวลาโพสต์
                        </button>
                    </div>

                    {!postNow && (
                        <div style={{ animation: 'fadeSlideIn 0.3s ease-out', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <div style={{ position: 'relative', height: '54px', cursor: 'pointer' }} onClick={() => document.getElementById('gs-date-input').showPicker()}>
                                <input id="gs-date-input" type="date" value={splitTime.date} onChange={e => handleDateChange(e.target.value)} style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer', pointerEvents: 'none' }} />
                                <div style={{ height: '100%', background: '#0a0a0a', border: `1.5px solid ${V.pri}`, borderRadius: '12px', display: 'flex', alignItems: 'center', padding: '0 12px', gap: '10px', boxSizing: 'border-box' }}>
                                    <Calendar size={16} style={{ color: V.pri }} />
                                    <div style={{ fontSize: '14px', fontWeight: '800', color: V.pri }}>{getThaiDateLabel(splitTime.date)}</div>
                                </div>
                            </div>
                            <div style={{ position: 'relative', height: '54px' }}>
                                <div style={{ height: '100%', background: '#0a0a0a', border: `1.5px solid ${V.pri}`, borderRadius: '12px', display: 'flex', alignItems: 'center', padding: '0 12px', gap: '6px', boxSizing: 'border-box' }}>
                                    <Clock size={16} style={{ color: V.pri }} />
                                    <input
                                        type="text"
                                        placeholder="13:00"
                                        value={splitTime.time}
                                        onChange={handleTimeChange}
                                        style={{
                                            background: 'none', border: 'none', color: '#fff', fontSize: '18px', fontWeight: '800',
                                            width: '100%', outline: 'none', fontFamily: 'inherit', letterSpacing: '1px'
                                        }}
                                    />
                                    <div style={{ fontSize: '13px', color: V.pri, fontWeight: '700', background: 'rgba(201,168,76,0.1)', padding: '4px 6px', borderRadius: '4px' }}>น.</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {isAutoReplyEnabledInTemplate && (
                        <div style={{ padding: '14px 16px', background: 'rgba(201,168,76,0.04)', borderRadius: '12px', border: '1px solid rgba(201,168,76,0.15)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: autoReplyEnabled ? '12px' : '0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '16px' }}>🤖</span>
                                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#e2c97e' }}>ตอบกลับคอมเมนต์อัตโนมัติ</span>
                                </div>
                                <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={autoReplyEnabled} onChange={e => setAutoReplyEnabled(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
                                    <span style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: autoReplyEnabled ? '#c9a84c' : 'rgba(255,255,255,0.1)', borderRadius: '24px', transition: '0.3s' }}>
                                        <span style={{ position: 'absolute', height: '18px', width: '18px', left: autoReplyEnabled ? '23px' : '3px', bottom: '3px', backgroundColor: 'white', borderRadius: '50%', transition: '0.3s' }} />
                                    </span>
                                </label>
                            </div>
                            {autoReplyEnabled && (
                                <textarea rows={3} placeholder="ข้อความที่บอทจะตอบกลับ..." value={autoReplyText} onChange={e => setAutoReplyText(e.target.value)} style={{ ...inputStyle, fontSize: '13px', resize: 'none', padding: '12px', marginTop: '4px' }} onFocus={focusIn} onBlur={focusOut} />
                            )}
                        </div>
                    )}

                    {error && <div style={{ color: V.err, fontSize: '13px', padding: '12px', background: 'rgba(224,85,85,0.08)', borderRadius: '10px', border: '1px solid rgba(224,85,85,0.15)', display: 'flex', alignItems: 'center', gap: '8px' }}><AlertCircle size={15} /> {error}</div>}
                    {success && <SuccessToast message={success} />}

                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '8px', marginTop: '10px' }}>
                        <button type="submit" disabled={loading} style={{ padding: '12px', borderRadius: '8px', fontSize: '14px', fontWeight: '700', border: 'none', background: V.pri, color: '#1a1200', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} บันทึก
                        </button>
                        <button type="button" onClick={onPreview} style={{ background: 'rgba(201,168,76,0.05)', border: `1px solid ${V.bdr}`, color: '#e2c97e', padding: '12px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <Eye size={16} /> ตัวอย่าง
                        </button>
                        <button type="button" onClick={onClear} style={{ background: 'rgba(224,85,85,0.05)', border: `1px solid rgba(224,85,85,0.1)`, color: V.err, padding: '12px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <Trash2 size={16} /> เคลียร์
                        </button>
                    </div>
                </form>
            </div>

            <style>{`
                .gs-image-scroller::-webkit-scrollbar { height: 6px; }
                .gs-image-scroller::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.2); border-radius: 3px; }
                .gs-card-body-scroll::-webkit-scrollbar { width: 8px; }
                .gs-card-body-scroll::-webkit-scrollbar-track { background: rgba(201,168,76,0.05); border-radius: 8px; }
                .gs-card-body-scroll::-webkit-scrollbar-thumb { background: linear-gradient(180deg, #c9a84c, #8a6d2b); border-radius: 8px; border: 2px solid rgba(20,17,10,0.6); box-shadow: 0 0 6px rgba(201,168,76,0.3); }
                @keyframes toastSlideIn { from { opacity: 0; transform: translateY(-12px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes toastProgress { from { width: 100%; } to { width: 0%; } }
                @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
};

export default React.memo(PostFormSection);
