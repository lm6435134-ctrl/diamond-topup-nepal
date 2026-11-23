# Payments and notifications

- Customer submits order with Free Fire UID and eSewa transaction ID.
- Customer submits wallet load request with amount and transaction ID.
- Backend stores requests and creates in-website notifications.
- Admin receives email alerts if Resend is configured.
- Admin verifies each transaction in eSewa independently.
- Admin can update order status; customer gets in-app notification and email (if configured).
- Admin can approve/reject wallet requests; approved amounts are credited by trusted server code.
- Transaction IDs are references only; never treat them as proof of payment.
- Duplicate wallet request approval is blocked by a Firestore transaction.
- No automatic UID verification or automatic diamond delivery is included.
