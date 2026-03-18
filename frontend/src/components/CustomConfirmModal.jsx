import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { V } from '../theme';

const CustomConfirmModal = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;

    return (
        <div onClick={onClose} style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000,
            animation: 'gsFadeIn 0.3s ease-out', padding: '16px'
        }}>
            <div onClick={e => e.stopPropagation()} style={{
                width: '100%', maxWidth: '380px', background: V.bgSec, borderRadius: '18px',
                border: `1px solid ${V.bdrH}`, boxShadow: '0 25px 80px rgba(0,0,0,0.9)',
                overflow: 'hidden', textAlign: 'center', position: 'relative'
            }}>
                {/* Header/Art */}
                <div style={{ height: '6px', background: `linear-gradient(90deg, ${V.priD}, ${V.pri}, ${V.priD})` }} />

                <div style={{ padding: '32px 24px 20px' }}>
                    <div style={{
                        width: '60px', height: '60px', borderRadius: '16px', background: 'rgba(224,85,85,0.1)',
                        border: '1px solid rgba(224,85,85,0.2)', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', margin: '0 auto 20px', color: V.err
                    }}>
                        <AlertCircle size={32} />
                    </div>

                    <h3 style={{ margin: '0 0 10px', fontSize: '18px', fontWeight: '800', color: V.priL }}>{title}</h3>
                    <p style={{ margin: 0, fontSize: '14px', color: V.txtS, lineHeight: '1.6' }}>{message}</p>
                </div>

                <div style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button onClick={onConfirm} style={{
                        width: '100%', padding: '12px', background: `linear-gradient(135deg, ${V.err}, #b91c1c)`,
                        color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '800', fontSize: '14px',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: '8px', boxShadow: '0 4px 15px rgba(224,85,85,0.3)', transition: 'transform 0.2s'
                    }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
                        ยืนยันการลบรายการ
                    </button>
                    <button onClick={onClose} style={{
                        width: '100%', padding: '12px', background: 'transparent', color: V.txtS,
                        border: `1px solid ${V.bdr}`, borderRadius: '10px', fontWeight: '600', fontSize: '14px',
                        cursor: 'pointer', transition: 'all 0.2s'
                    }} onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#fff'; }}
                        onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = V.txtS; }}>
                        ยกเลิก
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes gsFadeIn { from { opacity: 0; } to { opacity: 1; } }
            `}</style>
        </div>
    );
};

export default CustomConfirmModal;
