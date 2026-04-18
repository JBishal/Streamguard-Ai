# API Notes

## Current Endpoints

### `GET /`
- Returns a simple service status message.

### `GET /health`
- Returns `{"status": "ok"}` for quick health checks.

### `GET /incidents/mock`
- Loads starter records from `data/mock_posts.json`.
- Applies a lightweight rule-based scoring pass.
- Returns scored incidents for frontend development.

## Response Shape For `GET /incidents/mock`
- `platform`: source platform name
- `post_text`: original public post text
- `url`: flagged link
- `upvotes`: post engagement count
- `comments`: comment count
- `matched_keywords`: suspicious phrases matched in the post
- `piracy_confidence`: rule-based risk score from 0-100
- `engagement_score`: public-signal engagement score from 0-100
- `exposure_score`: blended score from 0-100
- `priority`: `low`, `medium`, or `high`

## Next API Work
- Replace mock loading with Reddit API ingestion
- Add Gemini classification enrichment
- Add filtering and summary endpoints for dashboard cards
