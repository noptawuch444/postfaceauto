import { X, Globe, ThumbsUp, MessageCircle, Share2, AlertCircle, Film } from 'lucide-react';
import { V } from '../theme';

const FacebookPreviewModal = ({ showPreview, setShowPreview, template, message, imagePreviews, postNow, scheduleTime }) => {
    if (!showPreview) return null;

    const avatarUrl = template?.page_id
        ? `https://graph.facebook.com/${template.page_id}/picture?type=large`
        : (template?.page_picture || "/GOLDSYNC.png");

    return (
        <div onClick={() => setShowPreview(false)} style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
            animation: 'gsFadeIn 0.3s ease-out', padding: '16px'
        }}>
            <div onClick={e => e.stopPropagation()} style={{
                width: '100%', maxWidth: '560px', background: '#242526', borderRadius: '12px',
                boxShadow: '0 25px 80px rgba(0,0,0,0.8)', overflow: 'hidden', color: '#e4e6eb',
                border: '1px solid #3e4042'
            }}>
                {/* Modal Header */}
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #3e4042', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#e4e6eb' }}>Facebook Mobile Preview</h3>
                    <button onClick={() => setShowPreview(false)} style={{
                        width: '36px', height: '36px', borderRadius: '50%', background: '#3a3b3c', border: 'none',
                        color: '#b0b3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'background 0.2s'
                    }} onMouseOver={e => e.currentTarget.style.background = '#4e4f50'} onMouseOut={e => e.currentTarget.style.background = '#3a3b3c'}><X size={20} /></button>
                </div>

                {/* Facebook Post Card */}
                <div style={{ padding: '12px 0 0' }}>
                    <div style={{ background: '#242526' }}>
                        {/* Post Header */}
                        <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#3a3b3c', overflow: 'hidden', flexShrink: 0 }}>
                                <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={e => { e.target.src = "/GOLDSYNC.png"; }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: '600', fontSize: '15px', color: '#e4e6eb', marginBottom: '2px' }}>
                                    {template?.page_name || 'Facebook Page'}
                                </div>
                                <div style={{ fontSize: '13px', color: '#b0b3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    {postNow ? 'Just now' : (scheduleTime ? new Date(scheduleTime).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }) : 'Scheduled')}
                                    <span style={{ margin: '0 2px' }}>·</span> <Globe size={12} fill="#b0b3b8" stroke="none" />
                                </div>
                            </div>
                            <div style={{ color: '#b0b3b8', padding: '4px' }}>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#b0b3b8' }} />
                                    <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#b0b3b8' }} />
                                    <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#b0b3b8' }} />
                                </div>
                            </div>
                        </div>

                        {/* Post Content */}
                        <div style={{ padding: '4px 16px 16px', fontSize: '15px', lineHeight: '1.4', color: '#e4e6eb', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {message || <span style={{ color: '#b0b3b8', fontStyle: 'italic' }}>Write something...</span>}
                        </div>

                        {/* Post Image(s) */}
                        {imagePreviews.length > 0 && (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: imagePreviews.length === 1 ? '1fr' : '1fr 1fr',
                                gap: '2px',
                                background: '#3e4042',
                                borderTop: '1px solid #3e4042',
                                borderBottom: '1px solid #3e4042'
                            }}>
                                {imagePreviews.slice(0, 4).map((img, i) => (
                                    <div key={i} style={{ position: 'relative', paddingTop: '100%', background: '#1c1e21' }}>
                                        <img src={img.src} alt="Preview" style={{
                                            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                                            objectFit: 'cover'
                                        }} />
                                        {i === 3 && imagePreviews.length > 4 && (
                                            <div style={{
                                                position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '24px', fontWeight: '700'
                                            }}>+{imagePreviews.length - 3}</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Reactions Bar */}
                        <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #3e4042', margin: '0 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '14px', color: '#b0b3b8' }}>0</span>
                            </div>
                            <div style={{ fontSize: '14px', color: '#b0b3b8' }}>
                                0 comments · 0 shares
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ padding: '4px 16px', display: 'flex', gap: '4px' }}>
                            {[
                                { icon: <ThumbsUp size={20} />, text: 'ถูกใจ' },
                                { icon: <MessageCircle size={20} />, text: 'แสดงความคิดเห็น' },
                                { icon: <Share2 size={20} />, text: 'แชร์' }
                            ].map((btn, i) => (
                                <div key={i} style={{
                                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    padding: '8px', borderRadius: '4px', color: '#b0b3b8', fontSize: '14px',
                                    fontWeight: '600', cursor: 'pointer', transition: 'background 0.2s',
                                    whiteSpace: 'nowrap'
                                }} onMouseOver={e => e.currentTarget.style.background = '#3a3b3c'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                                    {btn.icon} {btn.text}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button onClick={() => setShowPreview(false)} style={{
                        padding: '10px 28px', background: `linear-gradient(135deg, ${V.pri}, ${V.priD})`, color: '#1a1200',
                        border: 'none', borderRadius: '8px', fontWeight: '800', fontSize: '14px', cursor: 'pointer',
                        fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(201,168,76,0.3)', transition: 'transform 0.2s'
                    }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>Done</button>
                </div>
            </div>
        </div>
    );
};

export default FacebookPreviewModal;
