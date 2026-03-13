import { Clock, ShieldCheck } from 'lucide-react';
import GoldenSnow from '../components/GoldenSnow';
import { V } from '../theme';

function Waiting() {
    return (
        <div className="gs-wait-container" style={{
            background: V.bgMain,
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: '"Prompt", sans-serif',
            color: V.txt,
            position: 'relative',
            overflow: 'hidden'
        }}>
            <GoldenSnow />

            <div className="gs-wait-card" style={{
                width: '100%',
                maxWidth: '450px',
                padding: '48px 40px',
                background: V.bgSec,
                borderRadius: '24px',
                border: `1.5px solid ${V.bdr}`,
                boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
                position: 'relative',
                zIndex: 1001,
                textAlign: 'center'
            }}>
                <div className="gs-wait-logo" style={{
                    width: '88px',
                    height: '88px',
                    background: '#000',
                    border: `1.5px solid ${V.pri}`,
                    borderRadius: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 28px',
                    boxShadow: `0 0 30px ${V.pri}30`,
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <img src="/GOLDSYNC.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>

                <h2 className="gs-wait-title" style={{
                    fontSize: '24px',
                    fontWeight: '800',
                    color: V.priL,
                    marginBottom: '16px',
                    letterSpacing: '0.5px'
                }}>กรุณารอเจ้าหน้าที่</h2>

                <div style={{ marginBottom: '32px' }}>
                    <p style={{ color: V.txt, fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                        เราได้รับการเชื่อมต่อเพจของคุณเรียบร้อยแล้ว
                    </p>
                    <p style={{ color: V.txtS, fontSize: '14px', lineHeight: '1.6' }}>
                        ขณะนี้เจ้าหน้าที่กำลังตรวจสอบและดำเนินการสร้างลิงก์สำหรับโพสต์ให้คุณ กรุณารอสักครู่...
                    </p>
                </div>

                <div style={{
                    background: 'rgba(201,168,76,0.03)',
                    padding: '20px',
                    borderRadius: '16px',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '14px',
                    textAlign: 'left',
                    border: '1px solid rgba(201,168,76,0.1)'
                }}>
                    <ShieldCheck size={20} style={{ color: V.pri, flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ color: V.txtM, lineHeight: '1.5' }}>
                        <span style={{ fontWeight: '700', color: V.pri, display: 'block', marginBottom: '4px' }}>ไม่ต้องกังวล! ข้อมูลของคุณปลอดภัย</span>
                        คุณสามารถออกจากหน้านี้ได้ทันที ระบบจะแจ้งเตือนเมื่อลิงก์พร้อมใช้งาน
                    </div>
                </div>
            </div>

            <style>{`
                @media (max-width: 480px) {
                    .gs-wait-container { padding: 15px !important; }
                    .gs-wait-card { padding: 30px 20px !important; border-radius: 20px !important; }
                    .gs-wait-logo { width: 72px !important; height: 72px !important; margin-bottom: 20px !important; }
                    .gs-wait-title { font-size: 20px !important; }
                }
            `}</style>
        </div>
    );
}

export default Waiting;
