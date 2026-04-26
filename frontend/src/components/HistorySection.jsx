import React, { useState } from 'react';
import { History, MessageSquare, Calendar, Clock, CheckCircle2, Image as ImageIcon, Film, Trash2, ExternalLink, ImageOff, Sparkles } from 'lucide-react';
import { V } from '../theme';

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
    onPreview
}) => {
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
                                                    </div>
                                                    <button onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} style={{ background: 'none', border: 'none', color: 'rgba(224,85,85,0.4)', cursor: 'pointer', padding: '4px' }}><Trash2 size={14} /></button>
                                                </div>
                                                {item.message && <p style={{ fontSize: '13px', color: V.txt, margin: 0, whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{expandedItems[item.id] ? item.message : (item.message.length > 100 ? item.message.substring(0, 100) + '...' : item.message)}</p>}
                                                {expandedItems[item.id] && item.image_url && <div style={{ marginTop: '14px', animation: 'gsFadeIn 0.3s ease' }}><HistoryImage src={item.image_url} fbPostId={item.fb_post_id} /></div>}
                                                {item.image_url && <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px', color: V.pri, fontSize: '10px', fontWeight: '700' }}><ImageIcon size={10} /> {expandedItems[item.id] ? 'ย่อรูปภาพ' : 'ดูรูปภาพโพสต์'} {expandedItems[item.id] ? '▲' : '▼'}</div>}
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
        </div>
    );
};

export default React.memo(HistorySection);
