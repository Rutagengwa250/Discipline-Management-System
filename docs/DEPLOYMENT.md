# Deployment

## Production structure
- `admin/`: backend and admin/teacher/director pages
- `student/`: student signup assets served by backend
- `files/`: shared static assets

## Local run
```bash
npm install
npm run dev
```

## Production run
```bash
npm install --omit=dev
npm start
```

## Required env vars
- `MYSQL_HOST`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `MYSQL_DATABASE`
- `SECRET_KEY`
- `EMAIL_USER`
- `EMAIL_PASSWORD`

## Hosting
Deploy to your preferred Node host with start command:
```bash
npm start
```

