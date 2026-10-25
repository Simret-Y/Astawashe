# AstaWashe safety rules
- Never open, print, or copy any .env file. Only variable names are allowed.
- Never run git commit or git push.
- Never delete or rename existing files. Do not touch /frontend, /AudioAlert, or /Server2_BACKUP.
- Changes to /server1 must be additive only and must not break the React frontend. List every change in docs/BACKEND_CHANGES.md.
- Do not invent API endpoints. Read the real routes, controllers, and prisma schema.
- After every phase run: flutter pub get, dart format ., flutter analyze, and fix every issue.