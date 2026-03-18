# Event Collaboration API

A production-ready NestJS backend for managing events with conflict detection, automated merging, and AI-powered summarization.

## Tech Stack
- **Framework**: NestJS
- **ORM**: TypeORM
- **Database**: PostgreSQL
- **Cache**: Redis
- **Validation**: class-validator
- **Testing**: Jest

## Features
- **Modular Architecture**: Separate modules for users, events, merge logic, AI, auditing, and batch processing.
- **Conflict Detection**: Detects overlapping events for users.
- **Automated Merging**: Merges conflicting events into a single entry with transaction safety.
- **AI Summarization**: Generates event summaries via a mocked LLM synchronously, mapped with Redis caching.
- **Batch Processing**: High-performance bulk insert (up to 500 events) in under 2 seconds.

## Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Infrastructure**:
   Ensure you have PostgreSQL and Redis running locally on your machine.
   Update the `.env` file with your local credentials if they differ from the defaults.

4. **Run Application**:
   ```bash
   npm run start:dev
   ```

## Testing
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e
```

## API usage examples

### 1. Create User
```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com"}'
```

### 2. Create Event
```bash
curl -X POST http://localhost:3000/events \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Team Sync",
    "startTime": "2026-03-20T10:00:00Z",
    "endTime": "2026-03-20T11:00:00Z",
    "organizerId": "USER_ID"
  }'
```

### 3. Detect Conflicts
```bash
curl http://localhost:3000/events/conflicts/USER_ID
```

### 4. Merge Events
```bash
curl -X POST http://localhost:3000/events/merge-all/USER_ID
```

### 5. Batch Insert
```bash
curl -X POST http://localhost:3000/events/batch \
  -H "Content-Type: application/json" \
  -d '[
    {"title": "Event 1", "startTime": "...", "endTime": "...", "organizerId": "..."},
    {"title": "Event 2", "startTime": "...", "endTime": "...", "organizerId": "..."}
  ]'
```
