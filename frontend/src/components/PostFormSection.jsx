import React, { useState, useEffect, useRef } from 'react';
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
                    <Sparkles size={16} style={{ color: '#c9a84c' }} />
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

    return (
        <div className="gs-post-form-section" style={{ display: 'flex', flexDirection: 'column', minHeight: 0, minWidth: 0 }}>
            {/* Gold Header Bar */}
            <div style={{ background: V.pri, padding: '14px 20px', borderRadius: '14px 14px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1a1200', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    <Edit3 size={16} /> <span className="gs-header-title">สร้างรายการใหม่</span>
                </h3>
                <button onClick={() => window.location.reload()} style={{ background: 'rgba(0,0,0,0.12)', border: 'none', color: 'rgba(0,0,0,0.5)', padding: '4px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>รีเฟรช</button>
            </div>
            {/* Card Body */}
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
                height: '700px',
                maxHeight: '700px',
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(201,168,76,0.35) rgba(201,168,76,0.05)'
            }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative', zIndex: 1, minWidth: 0 }}>
                    {/* Message */}
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', color: V.txtS, marginBottom: '8px' }}>ข้อความ <span style={{ opacity: 0.5 }}>({message.length} ตัวอักษร)</span></label>
                        <textarea rows="10" placeholder="พิมพ์ข้อความที่ต้องการส่ง..." value={message} onChange={e => setMessage(e.target.value)}
                            style={{ ...inputStyle, fontSize: '14px', lineHeight: '1.5', resize: 'none', padding: '16px' }} onFocus={focusIn} onBlur={focusOut} />
                    </div>

                    {/* Image Section */}
                    <div style={{ minHeight: 0, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: V.txt, marginBottom: '10px' }}>รูปภาพ <span style={{ color: V.txtS, fontWeight: '400', fontSize: '13px', marginLeft: '4px' }}>({imagePreviews.length}/80)</span></label>

                        {imagePreviews.length === 0 ? (
                            <div onClick={() => document.getElementById('img-up').click()}
                                style={{
                                    width: '100%', height: '120px', borderRadius: '16px',
                                    border: `2px dashed rgba(201, 168, 76, 0.35)`, cursor: 'pointer', background: 'rgba(201,168,76,0.02)',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={e => { e.currentTarget.style.borderColor = V.pri; e.currentTarget.style.background = 'rgba(201,168,76,0.06)'; }}
                                onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(201, 168, 76, 0.35)'; e.currentTarget.style.background = 'rgba(201,168,76,0.02)'; }}>
                                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <ImageIcon size={24} style={{ color: V.pri }} />
                                </div>
                                <div style={{ fontSize: '14px', fontWeight: '700', color: V.txt }}>คลิกเพื่อเลือกรูปภาพ</div>
                            </div>
                        ) : (
                            <div className="gs-image-scroller" style={{
                                display: 'flex',
                                gap: '12px',
                                overflowX: 'auto',
                                paddingBottom: '12px',
                                paddingRight: '12px',
                                minHeight: '140px'
                            }}>
                                <div onClick={() => document.getElementById('img-up').click()}
                                    style={{
                                        width: '140px',
                                        aspectRatio: '1', borderRadius: '12px',
                                        border: `1.5px dashed rgba(201, 168, 76, 0.3)`, cursor: 'pointer', background: 'rgba(201,168,76,0.03)',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px',
                                        transition: 'all 0.2s', flexShrink: 0
                                    }}
                                    onMouseOver={e => { e.currentTarget.style.borderColor = V.pri; e.currentTarget.style.background = 'rgba(201,168,76,0.08)'; }}
                                    onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(201, 168, 76, 0.3)'; e.currentTarget.style.background = 'rgba(201,168,76,0.03)'; }}>
                                    <ImageIcon size={28} style={{ color: V.txtS, opacity: 0.6 }} />
                                </div>
                                {imagePreviews.map((img, i) => (
                                    <div key={i} style={{
                                        position: 'relative',
                                        width: '140px',
                                        aspectRatio: '1',
                                        borderRadius: '12px',
                                        background: '#0a0a0a',
                                        border: `1.5px solid ${V.bdr}`,
                                        overflow: 'hidden',
                                        flexShrink: 0
                                    }}>
                                        <button type="button" onClick={() => removeImage(i)} style={{
                                            position: 'absolute', top: '8px', right: '8px', width: '24px', height: '24px', borderRadius: '50%',
                                            background: 'rgba(224,85,85,0.9)', border: 'none', color: '#fff', fontSize: '12px', cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10
                                        }}>✕</button>
                                        <img src={img.src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                ))}
                            </div>
                        )}
                        <input id="img-up" type="file" hidden accept="image/*" multiple onChange={handleImageChange} />
                    </div>

                    {/* Post Mode Toggle */}
                    <div>
                        <div style={{ display: 'flex', gap: '0', background: V.bgMain, borderRadius: '10px', border: `1px solid ${V.bdr}`, overflow: 'hidden' }}>
                            <button type="button" onClick={() => { setPostNow(true); setScheduleTime(''); }}
                                style={{
                                    flex: 1, padding: '12px', border: 'none', fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontFamily: 'inherit', transition: '0.2s',
                                    background: postNow ? `linear-gradient(135deg, ${V.priD}, ${V.pri})` : 'transparent',
                                    color: postNow ? '#1a1200' : V.txtS
                                }}>
                                <Send size={14} /> <span className="btn-text">โพสต์ทันที</span>
                            </button>
                            <button type="button" onClick={() => setPostNow(false)}
                                style={{
                                    flex: 1, padding: '12px', border: 'none', borderLeft: `1px solid ${V.bdr}`, fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontFamily: 'inherit', transition: '0.2s',
                                    background: !postNow ? `linear-gradient(135deg, ${V.priD}, ${V.pri})` : 'transparent',
                                    color: !postNow ? '#1a1200' : V.txtS
                                }}>
                                <Clock size={14} /> <span className="btn-text">ตั้งเวลาโพสต์</span>
                            </button>
                        </div>
                    </div>

                    {/* Schedule Time */}
                    {!postNow && (
                        <div style={{ animation: 'fadeSlideIn 0.3s ease-out' }}>
                            <div
                                onClick={() => !postNow && dateTimeInputRef.current?.showPicker()}
                                style={{ position: 'relative', width: '100%', height: '54px', cursor: postNow ? 'default' : 'pointer' }}
                            >
                                {/* The actual input is invisible and non-interactive to clicks (pointer-events: none) */}
                                <input
                                    type="datetime-local"
                                    ref={dateTimeInputRef}
                                    lang="th"
                                    value={scheduleTime}
                                    onChange={e => setScheduleTime(e.target.value)}
                                    required={!postNow}
                                    disabled={postNow}
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        opacity: 0,
                                        zIndex: 1,
                                        pointerEvents: 'none'
                                    }}
                                />
                                <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    background: '#0a0a0a',
                                    border: `1.5px solid ${V.pri}`,
                                    borderRadius: '14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '0 16px',
                                    gap: '10px',
                                    boxSizing: 'border-box',
                                    zIndex: 2
                                }}>
                                    <Calendar size={18} style={{ color: V.pri }} />
                                    <div style={{ fontSize: '16px', fontWeight: '800', color: V.pri }}>
                                        {scheduleTime ?
                                            new Date(scheduleTime).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }) :
                                            'คลิกเพื่อเลือกเวลา...'
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Auto Reply Section */}
                    {isAutoReplyEnabledInTemplate && (
                        <div style={{ padding: '14px 16px', background: 'rgba(201,168,76,0.04)', borderRadius: '12px', border: '1px solid rgba(201,168,76,0.15)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: autoReplyEnabled ? '12px' : '0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '16px' }}>🤖</span>
                                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#e2c97e' }}>ตอบกลับคอมเมนต์อัตโนมัติ</span>
                                </div>
                                <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={autoReplyEnabled}
                                        onChange={e => setAutoReplyEnabled(e.target.checked)}
                                        style={{ opacity: 0, width: 0, height: 0 }}
                                    />
                                    <span style={{
                                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                        backgroundColor: autoReplyEnabled ? '#c9a84c' : 'rgba(255,255,255,0.1)',
                                        borderRadius: '24px', transition: '0.3s'
                                    }}>
                                        <span style={{
                                            position: 'absolute', height: '18px', width: '18px', left: autoReplyEnabled ? '23px' : '3px', bottom: '3px',
                                            backgroundColor: 'white', borderRadius: '50%', transition: '0.3s'
                                        }} />
                                    </span>
                                </label>
                            </div>
                            {autoReplyEnabled && (
                                <div style={{ animation: 'fadeSlideIn 0.2s ease-out' }}>
                                    <textarea
                                        rows={3}
                                        placeholder="ข้อความที่บอทจะตอบกลับคอมเมนต์... (เช่น ขอบคุณที่สนใจครับ! 🙏 ทักอินบ็อกซ์ได้เลยนะครับ)"
                                        value={autoReplyText}
                                        onChange={e => setAutoReplyText(e.target.value)}
                                        style={{ ...inputStyle, fontSize: '13px', lineHeight: '1.5', resize: 'none', padding: '12px', marginTop: '0', width: '100%', boxSizing: 'border-box' }}
                                        onFocus={focusIn} onBlur={focusOut}
                                    />
                                    <p style={{ fontSize: '11px', color: 'rgba(201,168,76,0.6)', marginTop: '6px' }}>
                                        * บอทจะตอบกลับทุกคอมเมนต์ที่โพสต์นี้โดยอัตโนมัติ
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Alerts */}
                    {error && <div style={{ color: V.err, fontSize: '13px', padding: '12px', background: 'rgba(224,85,85,0.08)', borderRadius: '10px', border: '1px solid rgba(224,85,85,0.15)', display: 'flex', alignItems: 'center', gap: '8px', animation: 'fadeSlideIn 0.3s ease-out' }}><AlertCircle size={15} /> {error}</div>}
                    {success && <SuccessToast message={success} />}

                    {/* Action Buttons */}
                    <div className="gs-actions-grid" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '8px', marginTop: '10px' }}>
                        <button type="submit" disabled={loading} className="gs-btn-thai" style={{ padding: '12px 4px', borderRadius: '8px', fontSize: '14px', fontWeight: '700', border: 'none', background: V.pri, color: '#1a1200', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} <span>บันทึก</span>
                        </button>
                        <button type="button" onClick={onPreview} className="gs-btn-thai" style={{ background: 'rgba(201,168,76,0.05)', border: `1px solid ${V.bdr}`, color: '#e2c97e', padding: '12px 4px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <Eye size={16} /> <span>ตัวอย่าง</span>
                        </button>
                        <button type="button" onClick={onClear} className="gs-btn-thai" style={{ background: 'rgba(224,85,85,0.05)', border: `1px solid rgba(224,85,85,0.1)`, color: V.err, padding: '12px 4px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <Trash2 size={16} /> <span>เคลียร์</span>
                        </button>
                    </div>
                </form>

                <style>{`
                .gs-image-scroller::-webkit-scrollbar { height: 6px; }
                .gs-image-scroller::-webkit-scrollbar-track { background: rgba(201,168,76,0.03); border-radius: 3px; }
                .gs-image-scroller::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.15); border-radius: 3px; }
                .gs-image-scroller::-webkit-scrollbar-thumb:hover { background: rgba(201,168,76,0.3); }

                .gs-card-body-scroll::-webkit-scrollbar { width: 8px; }
                .gs-card-body-scroll::-webkit-scrollbar-track {
                    background: rgba(201,168,76,0.05);
                    border-radius: 8px;
                    margin: 8px 0;
                }
                .gs-card-body-scroll::-webkit-scrollbar-thumb {
                    background: linear-gradient(180deg, #c9a84c, #8a6d2b);
                    border-radius: 8px;
                    border: 2px solid rgba(20,17,10,0.6);
                    box-shadow: 0 0 6px rgba(201,168,76,0.3);
                    transition: all 0.3s;
                }
                .gs-card-body-scroll::-webkit-scrollbar-thumb:hover {
                    background: linear-gradient(180deg, #e2c97e, #c9a84c);
                    box-shadow: 0 0 12px rgba(201,168,76,0.5), 0 0 4px rgba(201,168,76,0.3);
                }
                .gs-card-body-scroll::-webkit-scrollbar-thumb:active {
                    background: linear-gradient(180deg, #f0d98e, #e2c97e);
                    box-shadow: 0 0 16px rgba(201,168,76,0.6);
                }

                @keyframes toastSlideIn {
                    from { opacity: 0; transform: translateY(-12px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes toastSlideOut {
                    from { opacity: 1; transform: translateY(0) scale(1); }
                    to { opacity: 0; transform: translateY(-12px) scale(0.95); }
                }
                @keyframes toastProgress {
                    from { width: 100%; }
                    to { width: 0%; }
                }
                @keyframes toastShimmer {
                    0% { background-position: -200% center; }
                    100% { background-position: 200% center; }
                }
            `}</style>
            </div>

        </div>
    );
};

export default React.memo(PostFormSection);
