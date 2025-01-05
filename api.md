# Napstr API Documentation

## VPS Access

### SSH Connection
```bash
ssh napstr@85.239.241.122
```

### Server Location
- IP: 85.239.241.122
- Port: 3000 ||8080

## API Service Management

### PM2 Commands
```bash
# List all services
pm2 list

# Start the API service
pm2 start server.js --name napstr-api

# Restart the service
pm2 restart napstr-api

# View logs
pm2 logs napstr-api

# Monitor service
pm2 monit napstr-api
```

## Environment Setup

### Directory Structure
```
/home/napstr/services/api/
├── controllers/
├── middleware/
│   └── cache.js
├── models/
│   ├── analytics.js
│   └── song.js
├── routes/
│   ├── analytics.js
│   ├── lyrics.js
│   ├── songs.js
│   └── stream.js
├── services/
│   ├── analytics.js
│   ├── cache-manager.js
│   ├── cache-warmer.js
│   ├── performance-monitor.js
│   └── websocket.js
├── .env
├── server.js
└── package.json
```

### Environment Variables (.env)
```bash
# MongoDB Configuration
MONGO_URI=mongodb+srv://kid0733:Prasid2%40@napstr-music.0yla6.mongodb.net/?retryWrites=true&w=majority&appName=napstr-music
DB_NAME=music_library

# Server Configuration
PORT=3000
NODE_ENV=production

# Backblaze B2 Configuration
B2_BUCKET=napstr-music
B2_ENDPOINT=https://s3.us-west-004.backblazeb2.com
B2_KEY_ID=your_key_id
B2_APP_KEY=your_app_key
```

## API Endpoints

### Songs API
```
GET /api/v1/songs              - List all songs
GET /api/v1/songs/:id         - Get song details
GET /api/v1/songs/random      - Get a random song
```

### Lyrics API
```
GET /api/v1/lyrics/:trackId   - Get lyrics for a track (LRC format)
```

Response:
- Content-Type: text/plain
- Body: Raw LRC file content
- Status Codes:
  - 200: Success
  - 404: Song or lyrics not found
  - 500: Server error

### Analytics API
```
GET /api/v1/analytics/search-patterns  - Get search pattern analytics
GET /api/v1/analytics/performance      - Get performance metrics
GET /api/v1/analytics/summary          - Get analytics summary
```

### Example Responses

#### Search Patterns
```json
[
  {
    "_id": "Kendrick",
    "count": 10,
    "avgExecutionTime": 52.1,
    "avgResultCount": 14.3
  }
]
```

#### Performance Metrics
```json
[
  {
    "_id": {
      "hour": 0,
      "date": "2024-12-25"
    },
    "avgExecutionTime": 48,
    "totalQueries": 1
  }
]
```

#### Analytics Summary
```json
{
  "total": 34,
  "last24h": 33,
  "avgExecutionTime": 59.7,
  "topQueries": [
    {"_id": "Kendrick", "count": 10},
    {"_id": "Doechii", "count": 8}
  ]
}
```

## Storage Information

### MongoDB Database
- Database Name: music_library
- Collections:
  - songs
  - search_analytics

### Backblaze B2 Storage
- Bucket: napstr-music
- Folders:
  - lyrics/ - LRC format lyrics files
  - songs/ - Audio files
- File Naming:
  - Lyrics: lyrics/${trackId}.lrc
  - Songs: songs/${trackId}.${format}

### Collection Schemas

#### Songs Collection
```javascript
{
  track_id: String,
  spotify_id: String,
  title: String,
  artists: [String],
  album: String,
  duration_ms: Number,
  added_at: Date
}
```

#### Analytics Collection
```javascript
{
  query: String,
  filters: Object,
  resultCount: Number,
  executionTime: Number,
  timestamp: Date,
  userAgent: String,
  ip: String
}
```

## Testing

### Running Tests
```bash
# Run all tests
npm test

# Test analytics endpoints
curl "http://85.239.241.122:3000/api/v1/analytics/search-patterns"
curl "http://85.239.241.122:3000/api/v1/analytics/performance"
curl "http://85.239.241.122:3000/api/v1/analytics/summary"

# Test lyrics endpoint
curl "http://85.239.241.122:3000/api/v1/lyrics/ZiYAIEMfUlEZ"
```

### Database Verification
```bash
# Check database connection
node check-db.js

# Insert test analytics data
node test-analytics.js
```

## Troubleshooting

### Common Issues

1. Empty Analytics Results
   - Verify MongoDB connection
   - Check collection name ('search_analytics')
   - Ensure data exists in the collection

2. Server Connection Issues
   - Check if PM2 service is running
   - Verify port 3000 is open
   - Check server logs for errors

3. Lyrics Access Issues
   - Verify B2 credentials in .env
   - Check file exists in B2 bucket
   - Ensure correct file path format (lyrics/${trackId}.lrc)

### Useful Commands
```bash
# Check server status
pm2 status

# View real-time logs
pm2 logs napstr-api --lines 100

# Check MongoDB collections
node -e "require('dotenv').config(); const mongoose = require('mongoose'); async function check() { await mongoose.connect(process.env.MONGO_URI); console.log(await mongoose.connection.db.listCollections().toArray()); mongoose.connection.close(); } check();"

# Test B2 connection
node test-b2-lyrics.js
```
