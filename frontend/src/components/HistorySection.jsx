import { History, MessageSquare, Calendar, Clock, CheckCircle2, Image as ImageIcon, Film, Trash2, ExternalLink } from 'lucide-react';
import { V } from '../theme';

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
        <div className="gs-history-section" style={{ display: 'flex', flexDirection: 'column', minHeight: 0, minWidth: 0, maxWidth: '100%' }}>
            {/* Header */}
            <div style={{ background: V.pri, padding: '14px 20px', borderRadius: '14px 14px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1a1200', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    <History size={16} /> รายการรวมทั้งหมด ({history.length})
                </h3>
            </div>
            {/* Card Body */}
            <div className="gs-history-scroll-area" style={{
                background: V.bgSec,
                border: `1px solid ${V.bdr}`,
                borderTop: 'none',
                borderRadius: '0 0 14px 14px',
                padding: 0,
                overflowY: 'auto',
                overflowX: 'hidden',
                flex: 1,
                minHeight: 0,
                height: '700px', // Strict fixed height
                maxHeight: '700px'
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
                                {/* ── Date Divider (sticky) ── */}
                                <div onClick={() => setCollapsedDates(prev => ({ ...prev, [dateLabel]: !prev[dateLabel] }))}
                                    style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: '10px 16px', margin: 0,
                                        background: V.bgSec, borderBottom: `1px solid ${V.bdr}`, borderLeft: `4px solid ${V.pri}`,
                                        cursor: 'pointer', position: 'sticky', top: 0, zIndex: 10,
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: V.pri, fontSize: '14px', fontWeight: '700' }}>
                                        <Calendar size={14} /> {dateLabel}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span className="gs-item-count" style={{ fontSize: '12px', color: '#5a4e38', fontWeight: '400', background: 'rgba(201,168,76,0.06)', padding: '2px 9px', borderRadius: '10px' }}>
                                            {items.length} รายการ
                                        </span>
                                        <span style={{ color: '#5a4e38', fontSize: '12px' }}>{collapsedDates[dateLabel] ? '▶' : '▼'}</span>
                                    </div>
                                </div>

                                {/* ── Items ── */}
                                {!collapsedDates[dateLabel] && (
                                    <div style={{ padding: '12px 14px 14px' }}>
                                        {items.map((item, idx) => (
                                            <div key={idx} onClick={() => toggleExpand(item.id)}
                                                style={{
                                                    background: V.bgCard, border: `1px solid ${V.bdr}`, borderRadius: '10px',
                                                    padding: '14px 16px', marginBottom: '8px',
                                                    cursor: item.image_url ? 'pointer' : 'default',
                                                }}
                                            >
                                                {/* Status row */}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: item.message ? '8px' : '0' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <span style={{
                                                            fontSize: '10px', fontWeight: '700', padding: '3px 8px', borderRadius: '6px',
                                                            background: item.status === 'success' ? 'rgba(94,189,114,0.12)' : item.status === 'failed' ? 'rgba(224,85,85,0.12)' : 'rgba(201,168,76,0.12)',
                                                            color: item.status === 'success' ? V.ok : item.status === 'failed' ? V.err : V.pri,
                                                            border: `1px solid ${item.status === 'success' ? 'rgba(94,189,114,0.25)' : item.status === 'failed' ? 'rgba(224,85,85,0.25)' : V.bdr}`,
                                                            display: 'flex', alignItems: 'center', gap: '4px'
                                                        }}>
                                                            <CheckCircle2 size={10} />
                                                            {item.status === 'pending' ? 'รอส่ง' : item.status === 'success' ? 'ส่งแล้ว' : item.status}
                                                        </span>
                                                        <span style={{ fontSize: '11px', color: V.txtS, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <Clock size={10} />
                                                            {(item.schedule_time ? new Date(item.schedule_time) : new Date(item.created_at)).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}
                                                        </span>
                                                        {item.fb_post_id && item.status === 'success' && (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); window.open(`https://facebook.com/${item.fb_post_id}`, '_blank'); }}
                                                                style={{
                                                                    background: 'rgba(24,119,242,0.1)',
                                                                    border: '1px solid rgba(24,119,242,0.2)',
                                                                    color: '#1877f2',
                                                                    padding: '4px 8px',
                                                                    borderRadius: '6px',
                                                                    cursor: 'pointer',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '4px',
                                                                    fontSize: '10px',
                                                                    fontWeight: '700',
                                                                    marginLeft: '4px'
                                                                }}
                                                            >
                                                                <ExternalLink size={10} /> ดูบน Facebook
                                                            </button>
                                                        )}
                                                        {item.status === 'pending' && (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                                                                style={{
                                                                    background: 'rgba(224,85,85,0.1)',
                                                                    border: '1px solid rgba(224,85,85,0.2)',
                                                                    color: V.err,
                                                                    padding: '4px 8px',
                                                                    borderRadius: '6px',
                                                                    cursor: 'pointer',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '4px',
                                                                    fontSize: '10px',
                                                                    fontWeight: '700',
                                                                    marginLeft: '4px'
                                                                }}
                                                            >
                                                                <Trash2 size={10} /> ยกเลิก
                                                            </button>
                                                        )}
                                                    </div>
                                                    {item.image_url && (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: V.pri, fontSize: '11px', fontWeight: '600' }}>
                                                            <ImageIcon size={12} />
                                                            <span>
                                                                {(() => {
                                                                    try {
                                                                        const urls = JSON.parse(item.image_url);
                                                                        return Array.isArray(urls) ? `มีรูป ${urls.length} ใบ` : 'มีรูปภาพ';
                                                                    } catch (e) {
                                                                        return 'มีรูปภาพ';
                                                                    }
                                                                })()} {expandedItems[item.id] ? '▲' : '▼'}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                {/* Message */}
                                                {item.message && (
                                                    <p style={{ fontSize: '13px', color: V.txt, lineHeight: '1.5', whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>{item.message}</p>
                                                )}
                                                {/* Image (Expanded) */}
                                                {item.image_url && expandedItems[item.id] && (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                                                        {(() => {
                                                            try {
                                                                const urls = JSON.parse(item.image_url);
                                                                return Array.isArray(urls) ? urls.map((url, i) => (
                                                                    <div key={i} style={{ borderRadius: '8px', overflow: 'hidden', border: `1px solid ${V.bdr}`, background: '#000' }}>
                                                                        <img src={url} style={{ width: '100%', maxHeight: '400px', objectFit: 'contain' }} loading="lazy" />
                                                                    </div>
                                                                )) : (
                                                                    <div style={{ borderRadius: '8px', overflow: 'hidden', border: `1px solid ${V.bdr}`, background: '#000' }}>
                                                                        <img src={item.image_url} style={{ width: '100%', maxHeight: '400px', objectFit: 'contain' }} />
                                                                    </div>
                                                                );
                                                            } catch (e) {
                                                                return (
                                                                    <div style={{ borderRadius: '8px', overflow: 'hidden', border: `1px solid ${V.bdr}`, background: '#000' }}>
                                                                        <img src={item.image_url} style={{ width: '100%', maxHeight: '400px', objectFit: 'contain' }} />
                                                                    </div>
                                                                );
                                                            }
                                                        })()}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style>{`
                .gs-history-scroll-area::-webkit-scrollbar { width: 8px; }
                .gs-history-scroll-area::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
                .gs-history-scroll-area::-webkit-scrollbar-thumb { 
                    background: linear-gradient(180deg, ${V.priD}, ${V.pri}); 
                    border-radius: 4px;
                    border: 2px solid ${V.bgSec};
                }
                .gs-history-scroll-area::-webkit-scrollbar-thumb:hover { background: ${V.priL}; }
            `}</style>
        </div>
    );
};

export default React.memo(HistorySection);
