# Environment Variables Setup for Global Learning

To enable the global learning system in NagreGPT, you need to set up the following environment variables in a `.env` file:

## Required Environment Variables

Create a `.env` file in the root directory with:

```bash
# Groq API (Required for basic functionality)
VITE_GROQ_API_KEY=your_groq_api_key_here

# Firebase Realtime Database (For global learning storage)
VITE_FIREBASE_API_KEY=your_firebase_api_key_here

# GitHub Integration (For learning data collection)
VITE_GITHUB_TOKEN=your_github_token_here

# Webhook URL (Optional - for external analytics)
VITE_LEARNING_WEBHOOK_URL=https://your-webhook-url.com/nagregpt-feedback
```

## Setup Instructions

### 1. Firebase Realtime Database Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing one
3. Enable Realtime Database
4. Set database rules to allow writes:
   ```json
   {
     "rules": {
       "feedback": {
         ".read": false,
         ".write": true
       },
       "learning-patterns": {
         ".read": true,
         ".write": false
       }
     }
   }
   ```
5. Get your Web API key from Project Settings
6. Add it as `VITE_FIREBASE_API_KEY` in your `.env` file

### 2. GitHub Token Setup (Optional)

1. Go to GitHub Settings > Developer settings > Personal access tokens
2. Generate a new token with `repo` scope
3. Add it as `VITE_GITHUB_TOKEN` in your `.env` file

This enables automatic issue creation for learning data collection.

### 3. Webhook Setup (Optional)

You can integrate with services like:
- Zapier
- IFTTT  
- Custom webhook endpoints
- Analytics platforms

Set the URL as `VITE_LEARNING_WEBHOOK_URL` in your `.env` file.

## How Global Learning Works

### Data Collection
- User reactions (like, dislike, love) are collected anonymously
- Response patterns and success rates are analyzed
- Learning data is stored in Firebase Realtime Database

### Auto-Improvement Process
1. **Feedback Collection**: User reactions are submitted to global database
2. **Pattern Analysis**: Successful response patterns are identified
3. **Prompt Enhancement**: Future prompts are enhanced with learning context
4. **Response Optimization**: AI responses improve based on successful patterns

### Privacy & Security
- No personal information is collected
- Only reaction data and response patterns are stored
- All data is anonymized with session IDs
- Users can opt out of data collection

## Deployment on GitHub Pages

The learning system works seamlessly with GitHub Pages deployment:

1. Set environment variables in your deployment environment
2. The app will fall back to local storage if remote services are unavailable
3. Learning data syncs when services become available

## Testing the Learning System

1. Use the app and provide feedback (reactions) on AI responses
2. Open Learning Insights from the header menu
3. View local feedback stats and global learning patterns
4. Notice how AI responses improve over time based on feedback

## Advanced Configuration

### Custom Learning Endpoints
You can extend the learning system by:
- Adding custom analytics endpoints
- Integrating with ML pipelines
- Creating custom feedback processing systems

### Data Export
Learning data can be exported for analysis:
- Firebase console provides data export options
- GitHub issues contain structured learning data
- Webhook integrations allow real-time processing

## Troubleshooting

### Common Issues
1. **Firebase connection issues**: Check API key and database URL
2. **GitHub token permissions**: Ensure `repo` scope is granted
3. **Webhook timeouts**: Verify endpoint availability
4. **Local storage limits**: Clear browser storage if needed

### Fallback Behavior
- If Firebase is unavailable, data is stored locally
- If GitHub API fails, learning continues without issue tracking
- If webhooks fail, core functionality remains unaffected

The learning system is designed to degrade gracefully and continue working even if external services are unavailable.
