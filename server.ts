import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

function adminApp() {
  if (getApps().length) return getApps()[0];
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('Server Firebase credentials are not configured.');
  const serviceAccount = JSON.parse(raw);
  return initializeApp({ credential: cert(serviceAccount) });
}
export function serverDb() { adminApp(); return getFirestore(); }
export async function requireUser(req: Request) {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) throw new Error('Please sign in first.');
  adminApp();
  return getAuth().verifyIdToken(token);
}
export async function requireAdmin(req: Request) {
  const user = await requireUser(req);
  if ((user.email || '').toLowerCase() !== (process.env.ADMIN_EMAIL || '').toLowerCase() || !process.env.ADMIN_EMAIL) {
    throw new Error('Admin access denied.');
  }
  return user;
}
export async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) return false;
  const response = await fetch('https://api.resend.com/emails', {
    method:'POST',
    headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json'},
    body:JSON.stringify({from:process.env.EMAIL_FROM,to:[to],subject,html})
  });
  if (!response.ok) return false;
  return true;
}
export async function notify(uid: string, title: string, body: string, details: Record<string, unknown> = {}) {
  await serverDb().collection('notifications').add({
    userId:uid,title,body,details,read:false,createdAt:FieldValue.serverTimestamp()
  });
}
export { FieldValue };
