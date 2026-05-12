import React from 'react';
import { Shield, Book, Trash2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { V } from '../theme';

const PolicyLayout = ({ title, icon: Icon, children }) => (
    <div style={{
        minHeight: '100vh',
        background: V.bgMain,
        color: V.txt,
        fontFamily: '"Prompt", sans-serif',
        padding: '40px 20px'
    }}>
        <div style={{
            maxWidth: '800px',
            margin: '0 auto',
            background: V.bgSec,
            borderRadius: '24px',
            border: `1px solid ${V.bdr}`,
            overflow: 'hidden',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
        }}>
            <div style={{
                padding: '40px',
                borderBottom: `1px solid ${V.bdr}`,
                background: 'linear-gradient(180deg, rgba(201,168,76,0.1) 0%, transparent 100%)',
                textAlign: 'center'
            }}>
                <div style={{
                    width: '64px',
                    height: '64px',
                    background: 'rgba(201,168,76,0.1)',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: V.pri,
                    margin: '0 auto 20px',
                    border: `1px solid ${V.pri}40`
                }}>
                    <Icon size={32} />
                </div>
                <h1 style={{ fontSize: '28px', fontWeight: '800', color: V.priL, marginBottom: '8px' }}>{title}</h1>
                <p style={{ color: V.txtM, fontSize: '14px' }}>GoldSync AutoBot System</p>
            </div>

            <div style={{ padding: '40px', lineHeight: '1.8', color: V.txtS }}>
                {children}
            </div>

            <div style={{
                padding: '30px',
                textAlign: 'center',
                background: 'rgba(0,0,0,0.2)',
                borderTop: `1px solid ${V.bdr}`
            }}>
                <Link to="/" style={{
                    color: V.pri,
                    textDecoration: 'none',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                }}>
                    <ArrowLeft size={16} /> กลับหน้าหลัก
                </Link>
            </div>
        </div>
    </div>
);

export const PrivacyPolicy = () => (
    <PolicyLayout title="นโยบายความเป็นส่วนตัว" icon={Shield}>
        <h3>1. การเก็บรวบรวมข้อมูล</h3>
        <p>เราเก็บรวบรวมข้อมูลที่จำเป็นสำหรับการให้บริการโพสต์อัตโนมัติ ได้แก่ ชื่อเพจ, ID ของเพจ และ Access Token เพื่อใช้ในการเชื่อมต่อกับ Facebook API เท่านั้น</p>
        
        <h3>2. การใช้งานข้อมูล</h3>
        <p>ข้อมูล Access Token จะถูกใช้เพื่อวัตถุประสงค์ในการส่งโพสต์ตามคำสั่งของคุณ และการตอบกลับคอมเมนต์อัตโนมัติเท่านั้น เราจะไม่มีการนำข้อมูลไปเผยแพร่หรือใช้งานในวัตถุประสงค์อื่น</p>

        <h3>3. การรักษาความปลอดภัย</h3>
        <p>ข้อมูลทั้งหมดจะถูกเข้ารหัสและจัดเก็บไว้ในฐานข้อมูลที่มีความปลอดภัยสูง เข้าถึงได้เฉพาะระบบหลังบ้านของเราเท่านั้น</p>

        <h3>4. การติดต่อ</h3>
        <p>หากมีข้อสงสัยเกี่ยวกับนโยบายความเป็นส่วนตัว สามารถติดต่อแอดมินได้ผ่านหน้าเพจหลักของเรา</p>
    </PolicyLayout>
);

export const TermsOfService = () => (
    <PolicyLayout title="เงื่อนไขการใช้บริการ" icon={Book}>
        <h3>1. ข้อตกลงการใช้งาน</h3>
        <p>ผู้ใช้ตกลงที่จะใช้ระบบ GoldSync AutoBot ภายใต้กฎระเบียบของ Facebook และไม่ใช้ในทางที่ผิดกฎหมายหรือสร้างความเดือดร้อนแก่ผู้อื่น</p>

        <h3>2. ข้อจำกัดความรับผิดชอบ</h3>
        <p>เราไม่รับผิดชอบต่อความเสียหายใดๆ ที่เกิดจากการระงับบัญชีโดย Facebook หากผู้ใช้กระทำการละเมิดนโยบายของ Facebook เอง</p>

        <h3>3. การยกเลิกบริการ</h3>
        <p>ผู้ใช้สามารถยกเลิกการเชื่อมต่อเพจได้ทุกเมื่อผ่านหน้าจัดการเพจในระบบ</p>
    </PolicyLayout>
);

export const DataDeletion = () => (
    <PolicyLayout title="นโยบายการลบข้อมูล" icon={Trash2}>
        <p>หากคุณต้องการลบข้อมูลของคุณออกจากระบบ GoldSync AutoBot คุณสามารถดำเนินการได้ดังนี้:</p>
        
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px', marginTop: '20px' }}>
            <ol>
                <li>เข้าสู่ระบบหลังบ้านของ GoldSync</li>
                <li>ไปที่เมนู <strong>"จัดการเพจ"</strong></li>
                <li>กดปุ่ม <strong>"ลบ"</strong> (ไอคอนถังขยะ) ที่เพจที่ต้องการ</li>
                <li>ระบบจะทำการลบ Page ID และ Access Token ออกจากฐานข้อมูลของเราทันที</li>
            </ol>
        </div>

        <p style={{ marginTop: '20px' }}>นอกจากนี้ คุณยังสามารถยกเลิกสิทธิ์ของแอพผ่านหน้า Facebook Settings: <strong>Settings & Privacy > Settings > Business Integrations</strong> แล้วเลือกแอพ GoldSync เพื่อลบสิทธิ์ได้โดยตรงครับ</p>
    </PolicyLayout>
);
