import { readFile } from 'node:fs/promises';
import admin from 'firebase-admin';
const credentialPath=process.env.GOOGLE_APPLICATION_CREDENTIALS;
if(!credentialPath) throw new Error('Set GOOGLE_APPLICATION_CREDENTIALS to your private service-account JSON path.');
const serviceAccount=JSON.parse(await readFile(credentialPath,'utf8'));
admin.initializeApp({credential:admin.credential.cert(serviceAccount)});
const db=admin.firestore();
const packages=JSON.parse(await readFile(new URL('../packages.json',import.meta.url),'utf8'));
const batch=db.batch();
for(const item of packages){const {id,...data}=item;batch.set(db.collection('packages').doc(id),{...data,price:data.priceNpr,currency:'NPR',updatedAt:admin.firestore.FieldValue.serverTimestamp()},{merge:true});}
await batch.commit(); console.log(`Imported ${packages.length} packages.`); await admin.app().delete();
