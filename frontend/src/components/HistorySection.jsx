import React, { useState } from 'react';
import { History, MessageSquare, Calendar, Clock, CheckCircle2, Image as ImageIcon, Film, Trash2, ExternalLink, ImageOff, Sparkles, Share2, X, Copy, Check, Users } from 'lucide-react';
import { V } from '../theme';

// ---- localStorage helpers ----
const LS_KEY = (postId) => `gs_shared_groups_${postId}`;

const loadSharedGroups = (postId) => {
    try {
        const raw = localStorage.getItem(LS_KEY(postId));
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
};

const saveSharedGroups = (postId, groups) => {
    try { localStorage.setItem(LS_KEY(postId), JSON.stringify(groups)); } catch {}
};

// ---- Share to Group Modal ----
const ShareToGroupModal = ({ item, pageId, onClose }) => {
    const [sharedGroups, setSharedGroups] = useState(() => loadSharedGroups(item.id));
    const [groupUrl, setGroupUrl] = useState('');
    const [copied, setCopied] = useState(false);
    const [activeStep, setActiveStep] = useState('list'); // 'list' | 'add'

    const extractGroupInfo = (input) => {
        const cleaned = input.trim();
        const m = cleaned.match(/facebook\.com\/groups\/([^/?#\s]+)/);
        const gid = m ? m[1] : (/^\d+$/.test(cleaned) ? cleaned : (/^[\w.]+$/.test(cleaned) ? cleaned : null));
        if (!gid) return null;
        const url = `https://www.facebook.com/groups/${gid}`;
        const label = m ? (m[1].length > 20 ? m[1].substring(0, 20) + '…' : m[1]) : gid;
        return { gid, url, label };
    };

    const persistGroups = (groups) => {
        setSharedGroups(groups);
        saveSharedGroups(item.id, groups);
    };

    const handleOpenAndTick = (info) => {
        window.open(info.url, '_blank');
        // Auto-tick: mark as shared if not already
        if (!sharedGroups.find(g => g.gid === info.gid)) {
            const updated = [...sharedGroups, { gid: info.gid, url: info.url, label: info.label, sharedAt: new Date().toISOString(), ticked: true }];
            persistGroups(updated);
        } else {
            // Update sharedAt
            const updated = sharedGroups.map(g => g.gid === info.gid ? { ...g, sharedAt: new Date().toISOString(), ticked: true } : g);
            persistGroups(updated);
        }
    };

    const handleAddGroup = () => {
        const info = extractGroupInfo(groupUrl);
        if (!info) return;
        // Open group and add to list
        handleOpenAndTick(info);
        setGroupUrl('');
        setActiveStep('list');
    };

    const toggleTick = (gid) => {
        const updated = sharedGroups.map(g => g.gid === gid ? { ...g, ticked: !g.ticked } : g);
        persistGroups(updated);
    };

    const removeGroup = (gid) => {
        const updated = sharedGroups.filter(g => g.gid !== gid);
        persistGroups(updated);
    };

    const handleCopyMessage = () => {
        navigator.clipboard.writeText(item.message || '').then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        });
    };

    const tickedCount = sharedGroups.filter(g => g.ticked).length;

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={onClose}>
            <div style={{ width: '100%', maxWidth: '480px', background: V.bgSec, borderRadius: '18px', border: '1px solid rgba(24,119,242,0.25)', boxShadow: '0 24px 60px rgba(0,0,0,0.7)', overflow: 'hidden', fontFamily: '"Prompt", sans-serif', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div style={{ background: 'linear-gradient(135deg, #1877f2, #0d5cb8)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Users size={18} color="#fff" />
                        <div>
                            <div style={{ fontWeight: '800', fontSize: '15px', color: '#fff' }}>แชร์เข้ากลุ่ม Facebook</div>
                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>
                                {tickedCount > 0 ? `✓ แชร์แล้ว ${tickedCount} กลุ่ม` : 'ยังไม่ได้แชร์'}
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#fff', display: 'flex' }}>
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <div style={{ overflowY: 'auto', flex: 1 }}>
                    {/* Message preview */}
                    <div style={{ margin: '16px 16px 0', background: V.bgMain, borderRadius: '10px', padding: '10px 12px', border: `1px solid ${V.bdr}` }}>
                        <div style={{ fontSize: '10px', color: V.txtS, fontWeight: '700', marginBottom: '4px' }}>📝 ข้อความโพสต์</div>
                        <p style={{ fontSize: '12px', color: V.txt, margin: 0, whiteSpace: 'pre-wrap', lineHeight: '1.5', maxHeight: '60px', overflowY: 'auto' }}>{item.message || '(ไม่มีข้อความ)'}</p>
                        <button onClick={handleCopyMessage} style={{ marginTop: '8px', padding: '5px 10px', background: copied ? 'rgba(94,189,114,0.15)' : 'rgba(201,168,76,0.08)', border: `1px solid ${copied ? 'rgba(94,189,114,0.3)' : V.bdr}`, borderRadius: '6px', color: copied ? '#5ebd72' : V.pri, fontSize: '11px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '5px', transition: 'all 0.2s' }}>
                            {copied ? <><Check size={11} /> คัดลอกแล้ว!</> : <><Copy size={11} /> คัดลอกข้อความ</>}
                        </button>
                    </div>

                    {/* Shared Groups List */}
                    <div style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <span style={{ fontSize: '13px', fontWeight: '700', color: V.txt }}>
                                รายการกลุ่ม ({sharedGroups.length})
                            </span>
                            <button
                                onClick={() => setActiveStep(activeStep === 'add' ? 'list' : 'add')}
                                style={{ padding: '6px 12px', background: activeStep === 'add' ? 'rgba(255,255,255,0.08)' : '#1877f2', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '5px' }}
                            >
                                {activeStep === 'add' ? <><X size={12} /> ยกเลิก</> : <>+ เพิ่มกลุ่ม</>}
                            </button>
                        </div>

                        {/* Add Group Form */}
                        {activeStep === 'add' && (
                            <div style={{ marginBottom: '12px', padding: '12px', background: 'rgba(24,119,242,0.06)', borderRadius: '10px', border: '1px solid rgba(24,119,242,0.2)', animation: 'gsFadeIn 0.2s ease' }}>
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="https://www.facebook.com/groups/... หรือ Group ID"
                                    value={groupUrl}
                                    onChange={e => setGroupUrl(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleAddGroup()}
                                    style={{ width: '100%', padding: '10px 12px', boxSizing: 'border-box', background: V.bgMain, border: '1.5px solid rgba(24,119,242,0.3)', borderRadius: '8px', color: '#fff', fontSize: '13px', fontFamily: 'inherit', outline: 'none', marginBottom: '8px' }}
                                    onFocus={e => e.target.style.borderColor = '#1877f2'}
                                    onBlur={e => e.target.style.borderColor = 'rgba(24,119,242,0.3)'}
                                />
                                <button
                                    onClick={handleAddGroup}
                                    disabled={!groupUrl.trim()}
                                    style={{ width: '100%', padding: '10px', background: groupUrl.trim() ? '#1877f2' : 'rgba(24,119,242,0.2)', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: '800', fontSize: '13px', cursor: groupUrl.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                                >
                                    <Users size={14} /> เปิดกลุ่มและเพิ่มรายการ
                                </button>
                            </div>
                        )}

                        {/* Groups List */}
                        {sharedGroups.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '24px 0', opacity: 0.4 }}>
                                <Users size={32} style={{ color: V.txtS, marginBottom: '8px' }} />
                                <p style={{ fontSize: '12px', color: V.txtS, margin: 0 }}>ยังไม่มีกลุ่มในรายการ<br />กด "+ เพิ่มกลุ่ม" เพื่อเริ่มต้น</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {sharedGroups.map((g) => (
                                    <div key={g.gid} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: g.ticked ? 'rgba(94,189,114,0.06)' : V.bgMain, borderRadius: '10px', border: `1px solid ${g.ticked ? 'rgba(94,189,114,0.25)' : V.bdr}`, transition: 'all 0.2s' }}>
                                        {/* Tick Button */}
                                        <button
                                            onClick={() => toggleTick(g.gid)}
                                            title={g.ticked ? 'คลิกเพื่อยกเลิก tick' : 'คลิกเพื่อ tick ว่าแชร์แล้ว'}
                                            style={{ width: '26px', height: '26px', flexShrink: 0, borderRadius: '50%', border: `2px solid ${g.ticked ? '#5ebd72' : V.bdr}`, background: g.ticked ? '#5ebd72' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                                        >
                                            {g.ticked && <Check size={13} color="#fff" strokeWidth={3} />}
                                        </button>

                                        {/* Group Info */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '12px', fontWeight: '700', color: g.ticked ? '#5ebd72' : V.txt, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {g.label}
                                            </div>
                                            {g.sharedAt && (
                                                <div style={{ fontSize: '10px', color: V.txtS, opacity: 0.6 }}>
                                                    {new Date(g.sharedAt).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}
                                                </div>
                                            )}
                                        </div>

                                        {/* Open Group Button */}
                                        <button
                                            onClick={() => handleOpenAndTick(g)}
                                            title="เปิดกลุ่มนี้"
                                            style={{ flexShrink: 0, padding: '5px 8px', background: 'rgba(24,119,242,0.1)', border: '1px solid rgba(24,119,242,0.2)', borderRadius: '6px', color: '#1877f2', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '700', fontFamily: 'inherit' }}
                                        >
                                            <ExternalLink size={11} />
                                        </button>

                                        {/* Remove Button */}
                                        <button
                                            onClick={() => removeGroup(g.gid)}
                                            title="ลบออกจากรายการ"
                                            style={{ flexShrink: 0, padding: '5px', background: 'none', border: 'none', color: 'rgba(224,85,85,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
                                            onMouseOver={e => e.currentTarget.style.color = '#e05555'}
                                            onMouseOut={e => e.currentTarget.style.color = 'rgba(224,85,85,0.4)'}
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};


const getValidImageUrl = (rawUrl) => {
    if (!rawUrl) return null;
    if (typeof rawUrl !== 'string') return rawUrl;
    try {
        const parsed = JSON.parse(rawUrl);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
        return rawUrl;
    } catch (e) {
        return rawUrl;
    }
};

// Image component with broken-image fallback
const HistoryImage = ({ src, fbPostId }) => {
    const [broken, setBroken] = useState(false);

    if (broken) {
        return (
            <div style={{
                borderRadius: '8px', overflow: 'hidden',
                border: `1px solid ${V.bdr}`, background: 'rgba(201,168,76,0.04)',
                padding: '24px', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: '10px',
                minHeight: '120px'
            }}>
                <ImageOff size={28} style={{ color: 'rgba(201,168,76,0.35)' }} />
                <p style={{ fontSize: '12px', color: V.txtS, margin: 0, textAlign: 'center' }}>
                    รูปภาพไม่สามารถแสดงได้
                    <br /><span style={{ fontSize: '11px', opacity: 0.6 }}>(ไฟล์อาจถูกลบเมื่อเซิร์ฟเวอร์รีสตาร์ท)</span>
                </p>
                {fbPostId && (
                    <button
                        onClick={(e) => { e.stopPropagation(); window.open(`https://www.facebook.com/${fbPostId}`, '_blank'); }}
                        style={{
                            background: 'rgba(24,119,242,0.1)', border: '1px solid rgba(24,119,242,0.2)',
                            color: '#1877f2', padding: '6px 14px', borderRadius: '8px',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                            fontSize: '12px', fontWeight: '700', fontFamily: 'inherit',
                            transition: 'all 0.2s'
                        }}
                    >
                        <ExternalLink size={12} /> ดูโพสต์บน Facebook
                    </button>
                )}
            </div>
        );
    }

    return (
        <div style={{ borderRadius: '8px', overflow: 'hidden', border: `1px solid ${V.bdr}`, background: '#000' }}>
            <img src={src} style={{ width: '100%', maxHeight: '400px', objectFit: 'contain' }} loading="lazy" onError={() => setBroken(true)} />
        </div>
    );
};

const HistorySection = ({
    history,
    groupedHistory,
    collapsedDates,
    setCollapsedDates,
    expandedItems,
    toggleExpand,
    onDelete,
    onPreview,
    shareToGroupEnabled,
    pageId
}) => {
    const [shareModal, setShareModal] = useState(null); // { item }
    return (
        <div className="gs-history-section" style={{
            display: 'flex', flexDirection: 'column',
            background: V.bgSec, border: `1px solid ${V.bdr}`, borderRadius: '14px',
            overflow: 'hidden', height: '100%', position: 'relative'
        }}>

            {/* Header */}
            <div style={{ background: V.pri, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, zIndex: 10 }}>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1a1200', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    <History size={16} /> รายการรวมทั้งหมด ({history.length})
                </h3>
            </div>

            {/* Scrollable Body */}
            <div className="gs-history-scroll-area" style={{
                flex: 1, overflowY: 'auto', overflowX: 'hidden',
                padding: 0, position: 'relative', minHeight: 0
            }}>

                {history.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', opacity: 0.3 }}>
                        <MessageSquare size={40} style={{ margin: '0 auto 12px', color: V.txtS }} />
                        <p style={{ fontSize: '14px', color: V.txtS }}>ไม่มีข้อมูลรายการ</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {groupedHistory.map(([dateLabel, items], gi) => (
                            <div key={gi} style={{ display: 'flex', flexDirection: 'column' }}>
                                <div onClick={() => setCollapsedDates(prev => ({ ...prev, [dateLabel]: !prev[dateLabel] }))}
                                    style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: '10px 16px', margin: 0,
                                        background: V.bgSec, borderBottom: `1px solid ${V.bdr}`, borderLeft: `4px solid ${V.pri}`,
                                        cursor: 'pointer', position: 'sticky', top: 0, zIndex: 10,
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                                    }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: V.pri, fontSize: '14px', fontWeight: '700' }}><Calendar size={14} /> {dateLabel}</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '12px', color: '#5a4e38', fontWeight: '400', background: 'rgba(201,168,76,0.06)', padding: '2px 9px', borderRadius: '10px' }}>{items.length} รายการ</span>
                                        <span style={{ color: '#5a4e38', fontSize: '12px' }}>{collapsedDates[dateLabel] ? '▶' : '▼'}</span>
                                    </div>
                                </div>
                                {!collapsedDates[dateLabel] && (
                                    <div style={{ padding: '12px 14px 14px' }}>
                                        {items.map((item, idx) => (
                                            <div key={idx} onClick={() => toggleExpand(item.id)} style={{ background: V.bgCard, border: `1px solid ${V.bdr}`, borderRadius: '10px', padding: '14px 16px', marginBottom: '8px', cursor: item.image_url ? 'pointer' : 'default' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: item.message ? '8px' : '0' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <span style={{ fontSize: '10px', fontWeight: '700', padding: '3px 8px', borderRadius: '6px', background: item.status === 'success' ? 'rgba(94,189,114,0.12)' : item.status === 'failed' ? 'rgba(224,85,85,0.12)' : 'rgba(201,168,76,0.12)', color: item.status === 'success' ? V.ok : item.status === 'failed' ? V.err : V.pri, border: `1px solid ${item.status === 'success' ? 'rgba(94,189,114,0.25)' : item.status === 'failed' ? 'rgba(224,85,85,0.25)' : V.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle2 size={10} />{item.status === 'pending' ? 'รอส่ง' : item.status === 'success' ? 'ส่งแล้ว' : item.status}</span>
                                                        <span style={{ fontSize: '11px', color: V.txtS, display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={10} />{(item.schedule_time ? new Date(item.schedule_time) : new Date(item.created_at)).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}</span>
                                                        {item.status === 'success' && item.fb_post_id && (
                                                            <button onClick={(e) => { e.stopPropagation(); window.open(`https://www.facebook.com/${item.fb_post_id}`, '_blank'); }} style={{ background: 'rgba(24,119,242,0.1)', border: '1px solid rgba(24,119,242,0.2)', color: '#1877f2', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '700', fontFamily: 'inherit', transition: 'all 0.2s' }}><ExternalLink size={10} /> ดูบน FB</button>
                                                        )}
                                                        {shareToGroupEnabled && item.status === 'success' && item.fb_post_id && (() => {
                                                            const grps = loadSharedGroups(item.id);
                                                            const tickedN = grps.filter(g => g.ticked).length;
                                                            return (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setShareModal({ item }); }}
                                                                    style={{ background: tickedN > 0 ? 'rgba(94,189,114,0.12)' : 'rgba(24,119,242,0.15)', border: `1px solid ${tickedN > 0 ? 'rgba(94,189,114,0.35)' : 'rgba(24,119,242,0.35)'}`, color: tickedN > 0 ? '#5ebd72' : '#5b9bd5', padding: '5px 10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: '700', fontFamily: 'inherit', transition: 'all 0.2s', position: 'relative' }}
                                                                    title="แชร์โพสต์นี้เข้ากลุ่ม Facebook"
                                                                >
                                                                    {tickedN > 0 ? <Check size={10} strokeWidth={3} /> : <Share2 size={10} />}
                                                                    แชร์เข้ากลุ่ม
                                                                    {tickedN > 0 && (
                                                                        <span style={{ background: '#5ebd72', color: '#fff', borderRadius: '10px', fontSize: '9px', fontWeight: '900', padding: '1px 5px', lineHeight: '1.4' }}>
                                                                            {tickedN}
                                                                        </span>
                                                                    )}
                                                                </button>
                                                            );
                                                        })()}
                                                    </div>
                                                    <button onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} style={{ background: 'none', border: 'none', color: 'rgba(224,85,85,0.4)', cursor: 'pointer', padding: '4px' }}><Trash2 size={14} /></button>
                                                </div>
                                                {item.message && <p style={{ fontSize: '13px', color: V.txt, margin: 0, whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{expandedItems[item.id] ? item.message : (item.message.length > 100 ? item.message.substring(0, 100) + '...' : item.message)}</p>}
                                                {expandedItems[item.id] && getValidImageUrl(item.image_url) && <div style={{ marginTop: '14px', animation: 'gsFadeIn 0.3s ease' }}><HistoryImage src={getValidImageUrl(item.image_url)} fbPostId={item.fb_post_id} /></div>}
                                                {getValidImageUrl(item.image_url) && <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px', color: V.pri, fontSize: '10px', fontWeight: '700' }}><ImageIcon size={10} /> {expandedItems[item.id] ? 'ย่อรูปภาพ' : 'ดูรูปภาพโพสต์'} {expandedItems[item.id] ? '▲' : '▼'}</div>}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer placeholder for symmetry */}
            <div className="gs-card-footer" style={{
                padding: '16px 20px', borderTop: `1px solid ${V.bdr}`, background: 'rgba(0,0,0,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '62px', flexShrink: 0
            }}>
                <div style={{ fontSize: '11px', color: V.txtS, fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={12} style={{ color: V.pri }} />
                    รายการล่าสุดอยู่ที่ด้านบนสุด
                </div>
            </div>

            <style>{`
                .gs-history-scroll-area::-webkit-scrollbar { width: 8px; }
                .gs-history-scroll-area::-webkit-scrollbar-track { background: rgba(201,168,76,0.05); border-radius: 8px; }
                .gs-history-scroll-area::-webkit-scrollbar-thumb { background: linear-gradient(180deg, #c9a84c, #8a6d2b); border-radius: 8px; border: 2px solid rgba(20,17,10,0.6); box-shadow: 0 0 6px rgba(201,168,76,0.3); }
                @keyframes gsFadeIn { from { opacity: 0 } to { opacity: 1 } }
            `}</style>

            {/* Share to Group Modal */}
            {shareModal && (
                <ShareToGroupModal
                    item={shareModal.item}
                    pageId={pageId}
                    onClose={() => setShareModal(null)}
                />
            )}
        </div>
    );
};

export default React.memo(HistorySection);
