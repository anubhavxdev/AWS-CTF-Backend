# Ticketing-System-Backend

Dev scripts

```bash
npm run dev
```

Environment variables

```env
PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017/ticketing_system
CASHFREE_ENV=sandbox
CASHFREE_APP_ID=your_app_id
CASHFREE_SECRET_KEY=your_secret_key
JWT_SECRET=change_this_secret
```

Health check: GET `/health`

Quick start

```bash
cp .env.example .env # or create .env using vars above
npm run dev
```