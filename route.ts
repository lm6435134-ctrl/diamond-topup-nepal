import { NextResponse } from 'next/server';
import { FieldValue, notify, requireAdmin, sendEmail, serverDb } from '@/lib/server';
export const runtime = 'nodejs';
export async function GET(req: Request) {
  try {
    await requireAdmin(req);
    const db=serverDb();
    const [orders,wallets]=await Promise.all([
      db.collection('orders').orderBy('createdAt','desc').limit(100).get(),
      db.collection('walletRequests').orderBy('createdAt','desc').limit(100).get()
    ]);
    const clean=(s:any)=>s.docs.map((d:any)=>({id:d.id,...d.data(),createdAt:d.data().createdAt?.toDate?.()?.toISOString() || null}));
    return NextResponse.json({orders:clean(orders),walletRequests:clean(wallets)});
  } catch(e:any) { return NextResponse.json({error:e.message || 'Admin access denied.'},{status:403}); }
}
export async function PATCH(req: Request) {
  try {
    await requireAdmin(req);
    const {type,id,status}=await req.json();
    const db=serverDb();
    if (type==='order') {
      const ref=db.collection('orders').doc(id), snap=await ref.get();
      if (!snap.exists) return NextResponse.json({error:'Order not found.'},{status:404});
      const o=snap.data()!;
      const allowed=['Verifying','Processing','Completed','Cancelled','Payment Rejected'];
      if (!allowed.includes(status)) return NextResponse.json({error:'Invalid status.'},{status:400});
      await ref.update({status,updatedAt:FieldValue.serverTimestamp()});
      await notify(o.userId, status==='Completed'?'Top-up completed':'Order updated',`Your order ${id} status is now ${status}.`,{orderId:id,transactionId:o.transactionId || ''});
      if (o.customerEmail) await sendEmail(o.customerEmail,`Order ${id}: ${status}`,`<h2>Diamond Topup Nepal</h2><p>Your order status is now <b>${status}</b>.</p><p>Order ID: ${id}</p><p>Package: ${o.packageName}</p><p>Transaction ID: ${o.transactionId}</p><p>Player UID: ${o.uid}</p>`);
      return NextResponse.json({ok:true});
    }
    if (type==='wallet') {
      const ref=db.collection('walletRequests').doc(id), snap=await ref.get();
      if (!snap.exists) return NextResponse.json({error:'Wallet request not found.'},{status:404});
      const w=snap.data()!;
      if (w.status!=='Pending') return NextResponse.json({error:'This request was already handled.'},{status:409});
      if (!['Approved','Rejected'].includes(status)) return NextResponse.json({error:'Invalid wallet status.'},{status:400});
      await db.runTransaction(async tx=>{
        const fresh=await tx.get(ref);
        if (!fresh.exists || fresh.data()?.status!=='Pending') throw new Error('Request already processed.');
        tx.update(ref,{status,updatedAt:FieldValue.serverTimestamp()});
        if (status==='Approved') {
          const userRef=db.collection('users').doc(w.userId);
          tx.set(userRef,{walletBalance:FieldValue.increment(w.amountNpr),updatedAt:FieldValue.serverTimestamp()},{merge:true});
          const ledger=db.collection('walletTransactions').doc();
          tx.set(ledger,{userId:w.userId,type:'Credit',amountNpr:w.amountNpr,requestId:id,createdAt:FieldValue.serverTimestamp()});
        }
      });
      await notify(w.userId,status==='Approved'?'Wallet credited':'Wallet request rejected',status==='Approved'?`Rs. ${w.amountNpr} has been added to your wallet.`:'Your wallet load request was rejected.',{requestId:id,transactionId:w.transactionId});
      if (w.customerEmail) await sendEmail(w.customerEmail,`Wallet request ${status.toLowerCase()}`,`<p>Your wallet request ${id} is ${status}.</p><p>Amount: Rs. ${w.amountNpr}</p><p>Transaction ID: ${w.transactionId}</p>`);
      return NextResponse.json({ok:true});
    }
    return NextResponse.json({error:'Unknown request type.'},{status:400});
  } catch(e:any) { return NextResponse.json({error:e.message || 'Could not update.'},{status:400}); }
}
