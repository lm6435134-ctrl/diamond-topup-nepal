# DIAMOND TOPUP NEPAL — setup guide (Android/Acode friendly)

## Included in this build
- Customer email/password sign-up and login, plus Google sign-in button.
- Customer name is taken from the registered account.
- Updated diamond/membership/pass price list from your supplied poster.
- Diamond order form with Player UID and required eSewa transaction ID.
- Wallet coin-load request with amount and required transaction ID.\n- Diamond orders can be paid using eSewa QR or a sufficient wallet balance.
- Customer order history, wallet balance and in-website notification feed.
- Admin dashboard (admin email is configured in `.env.local`) for order status and wallet request approval/rejection.
- Server-side email alerts to the admin and customer when Resend is configured.

## Important limitations (not fake features)
- eSewa QR is not displayed until you place your real merchant QR at `public/payment-qr.png`.
- A transaction ID is customer-entered text, NOT proof of payment. Admin must verify it in the merchant eSewa account before approval.
- Player name / Bangladesh region UID verification is not connected.
- Diamond delivery is not automated. Admin marks the order Completed only after actually delivering the top-up.
- Wallet balance is credited by the server only after admin approves the wallet request.
- Email will not send until Resend and a verified sender domain are configured.
- Google sign-in requires enabling Google provider in Firebase Authentication.
- Configure and test this project before accepting real customer payments.

## 1. Firebase
1. Create/open a Firebase project at https://console.firebase.google.com/
2. Add a Web app; copy its config into `.env.local` using `.env.example`.
3. Enable Authentication > Email/Password. Enable Google if wanted.
4. Create Firestore Database.
5. Publish `firestore.rules`.
6. Create a service account in Firebase Project settings > Service accounts. Keep its JSON private; put the full JSON string in server-only `FIREBASE_SERVICE_ACCOUNT_JSON` in deployment environment.
7. Run `npm run seed:packages` in a trusted environment with `GOOGLE_APPLICATION_CREDENTIALS` pointing to the service-account file. Or import `packages.json` documents into Firestore manually.

## 2. Admin
Set `ADMIN_EMAIL=saimanmagar442@gmail.com` in server environment. Create/sign into a Firebase account with that exact email. Do not rely on the public admin email setting alone; API checks the server-only ADMIN_EMAIL.

## 3. Email notifications
Create a Resend account when accessible, verify a sender domain, then set `RESEND_API_KEY` and `EMAIL_FROM` in server environment. Never put the Resend key in a `NEXT_PUBLIC_` variable or browser code. Email sends to admin and customer for new orders / wallet requests; customer receives status and wallet updates.

## 4. Run
```bash
npm install
cp .env.example .env.local
# fill in Firebase config and server values
npm run dev
```
Deploy to a Node.js-compatible host that supports Next.js API routes and server environment variables.

## 5. Payment QR
Replace `public/payment-qr.png` with your own eSewa merchant QR. Verify the QR ownership and test a small payment before launch.
