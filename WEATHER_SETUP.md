# Weather Integration - Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Get OpenWeatherMap API Key

1. Go to [https://openweathermap.org/api](https://openweathermap.org/api)
2. Click "Sign Up" (top right)
3. Create a free account
4. Verify your email
5. Navigate to API Keys section in your account
6. Copy your API key (it may take a few minutes to activate)

### Step 2: Add API Key to Environment

1. Open `.env.local` in your project root (create it if it doesn't exist)
2. Add this line:
   ```bash
   NEXT_PUBLIC_OPENWEATHER_API_KEY=your_api_key_here
   ```
3. Replace `your_api_key_here` with your actual API key

### Step 3: Restart Development Server

```bash
npm run dev
```

### Step 4: Test the Integration

Visit the demo page: [http://localhost:3000/weather-demo](http://localhost:3000/weather-demo)

## ✅ Verification Checklist

- [ ] API key is added to `.env.local`
- [ ] Development server restarted
- [ ] Demo page loads without errors
- [ ] Weather data displays for selected locations
- [ ] Wind indicator rotates correctly
- [ ] Forecast tabs work (Daily/Hourly)
- [ ] Impact calculations show correct values

## 📦 What's Included

### Services
- ✅ `weatherService.ts` - OpenWeatherMap integration
- ✅ `elevationService.ts` - Open-Elevation API integration
- ✅ `recommendationService.ts` - Weather-adjusted club recommendations

### Components
- ✅ `WeatherCard` - Current conditions display
- ✅ `WindIndicator` - Wind compass with impact
- ✅ `WeatherForecast` - 7-day + hourly forecasts
- ✅ `WeatherImpactDisplay` - Detailed impact breakdown

### Hooks
- ✅ `useWeather` - Auto-refreshing weather data

### Types
- ✅ Complete TypeScript definitions for all weather data

## 🎯 Integration Examples

### 1. Add Weather to Any Page

```tsx
'use client';

import { useWeather } from '@/hooks/useWeather';
import { WeatherCard } from '@/components/weather';

export default function MyPage() {
  const { weather, loading } = useWeather({
    location: { latitude: 40.7128, longitude: -74.0060 }
  });

  if (loading) return <div>Loading...</div>;

  return <WeatherCard weather={weather} />;
}
```

### 2. Get Club Recommendation with Weather

```tsx
import { getCurrentWeather } from '@/services/weatherService';
import { recommendClubForDistance } from '@/services/recommendationService';

const weather = await getCurrentWeather(lat, lon);
const clubs = [...]; // Your clubs array

const recommendation = recommendClubForDistance(
  150, // target distance
  clubs,
  weather,
  0, // elevation change
  0 // shot direction
);

console.log('Use:', recommendation.club.name);
console.log('Adjusted distance:', recommendation.adjustedDistance);
```

### 3. Show Wind Impact

```tsx
import { WindIndicator } from '@/components/weather';

<WindIndicator
  speed={weather.windSpeed}
  direction={weather.windDirection}
  shotDirection={90} // Shot direction in degrees
  impactYards={-5}
/>
```

## 📊 API Limits & Costs

### Free Tier (Default)
- **Calls per day**: 1,000
- **Calls per minute**: 60
- **Cost**: FREE
- **Sufficient for**: ~100 active users/day with caching

### How Caching Helps
- Weather data cached for 15 minutes
- Elevation data cached for 24 hours
- Multiple users can share cached data
- Reduces API calls by ~90%

### When to Upgrade
Upgrade to a paid plan when:
- You exceed 1,000 calls/day
- You need minute-by-minute forecasts
- You need weather alerts
- You have 100+ daily active users

**Paid plans start at $40/month for 100,000 calls/day**

## 🔧 Troubleshooting

### Problem: Weather not loading

**Solution 1: Check API Key**
```bash
# In .env.local
NEXT_PUBLIC_OPENWEATHER_API_KEY=abc123...  # Your key here
```

**Solution 2: Wait for API Key Activation**
- New API keys can take 10 minutes to 2 hours to activate
- Try again after waiting

**Solution 3: Check Browser Console**
```
Open DevTools → Console → Look for errors
```

### Problem: "Failed to fetch weather data"

**Check:**
1. Internet connection is active
2. API key is correct (no extra spaces)
3. API key is activated (check OpenWeatherMap dashboard)
4. You haven't exceeded rate limits

### Problem: Wind indicator not showing

**Check:**
1. Weather data includes `windSpeed` and `windDirection`
2. Values are valid numbers (not null/undefined)
3. Component is imported correctly

### Problem: Rate limit exceeded

**Solutions:**
1. Ensure caching is working (check Network tab)
2. Reduce refresh frequency
3. Upgrade to paid plan
4. Clear cache and restart: `clearWeatherCache()`

## 🚀 Production Deployment

### Before Deploying

1. **Add API Key to Production Environment**
   - Vercel: Project Settings → Environment Variables
   - Add: `NEXT_PUBLIC_OPENWEATHER_API_KEY`
   - Deploy

2. **Consider Upgrading Cache**
   - Use Redis instead of in-memory cache
   - Use Vercel Edge Config for edge caching
   - Reduces API calls significantly

3. **Monitor API Usage**
   - Check OpenWeatherMap dashboard
   - Set up alerts for 80% usage
   - Plan upgrade if needed

### Vercel Deployment

```bash
# Add environment variable
vercel env add NEXT_PUBLIC_OPENWEATHER_API_KEY

# Paste your API key when prompted

# Deploy
vercel --prod
```

### Environment Variable in Vercel Dashboard

1. Go to your project on Vercel
2. Settings → Environment Variables
3. Add new variable:
   - **Key**: `NEXT_PUBLIC_OPENWEATHER_API_KEY`
   - **Value**: Your API key
   - **Environments**: Production, Preview, Development
4. Redeploy your project

## 📱 Mobile App Integration

The same services work for mobile apps:

1. Ensure API key is accessible in mobile environment
2. Use same service functions
3. Consider React Native components for UI
4. Implement background location tracking

## 🔐 Security Notes

### Is it safe to use NEXT_PUBLIC_ prefix?

**Yes!** The OpenWeatherMap API key is designed for client-side use:
- It's domain-restricted in OpenWeatherMap settings
- Rate limiting protects against abuse
- No sensitive data exposed

### Best Practices

1. **Restrict API Key** (in OpenWeatherMap dashboard):
   - Add your domain to allowed domains
   - Enable HTTP referrer restriction
   - Monitor usage regularly

2. **Don't commit .env.local**:
   - Already in `.gitignore`
   - Never commit API keys to Git

3. **Rotate Keys**:
   - Change API key if exposed
   - OpenWeatherMap allows multiple keys

## 📚 Additional Resources

- **Full Documentation**: See `WEATHER_INTEGRATION.md`
- **Demo Page**: `/weather-demo`
- **OpenWeatherMap Docs**: [https://openweathermap.org/api](https://openweathermap.org/api)
- **Component Examples**: See demo page source code

## 💡 Next Steps

1. ✅ Test the demo page
2. ✅ Read full documentation (`WEATHER_INTEGRATION.md`)
3. ✅ Integrate weather into your pages:
   - Dashboard
   - Course detail pages
   - Round tracking
   - Club selection
4. ✅ Customize components to match your design
5. ✅ Test with different locations
6. ✅ Deploy to production

## 🎉 You're Ready!

Weather integration is now fully set up and ready to use. Check out the demo page to see all features in action!

**Questions?** See `WEATHER_INTEGRATION.md` for comprehensive documentation.
