# Weather Integration Guide

## Overview

CaddyAI now includes comprehensive weather and elevation integration to provide real-time club recommendations adjusted for current conditions. This guide covers setup, usage, and implementation details.

## Features

✅ **Real-time Weather Data** - Live temperature, wind, humidity, and conditions
✅ **7-Day Forecast** - Plan your rounds with detailed daily forecasts
✅ **Hourly Forecast** - Hour-by-hour weather for the next 48 hours
✅ **Wind Analysis** - Wind speed, direction, and impact calculations
✅ **Elevation Data** - Automatic elevation changes for uphill/downhill shots
✅ **Weather Impact Display** - Shows how conditions affect shot distance
✅ **Automatic Caching** - 15-minute cache to reduce API calls
✅ **Auto-refresh** - Updates weather data automatically during rounds

## Setup

### 1. Get OpenWeatherMap API Key

1. Visit [OpenWeatherMap](https://openweathermap.org/api)
2. Sign up for a free account
3. Navigate to API Keys section
4. Copy your API key

**Free Tier Limits:**
- 1,000 calls/day
- 60 calls/minute
- Sufficient for ~100 users with caching

### 2. Configure Environment Variables

Add to your `.env.local` file:

```bash
NEXT_PUBLIC_OPENWEATHER_API_KEY=your_api_key_here
```

### 3. Install Dependencies

All required dependencies are already installed:
- `lucide-react` - Icons for weather UI
- React hooks for state management

## Architecture

### Services

#### `weatherService.ts`
Core weather API integration with OpenWeatherMap:
- `getCurrentWeather(lat, lon)` - Current conditions
- `getDailyForecast(lat, lon)` - 7-day forecast
- `getHourlyForecast(lat, lon)` - Hourly forecast (48 hours)
- `getWeatherAlerts(lat, lon)` - Weather alerts (requires paid plan)
- `analyzeWeatherConditions(lat, lon)` - Full weather analysis
- `clearWeatherCache()` - Manual cache invalidation

#### `elevationService.ts`
Elevation data using Open-Elevation API (free, no key required):
- `getElevation(lat, lon)` - Elevation in meters
- `getElevationFeet(lat, lon)` - Elevation in feet
- `getElevationChange(from, to)` - Elevation difference between points
- `clearElevationCache()` - Manual cache invalidation

#### `recommendationService.ts`
Club recommendation calculations with weather adjustments:
- `calculateWeatherImpact()` - Calculate total weather impact on distance
- `calculateWindEffect()` - Wind impact calculation
- `adjustDistanceForConditions()` - Adjust club distance for conditions
- `recommendClubForDistance()` - Recommend best club for target distance
- `getHoleRecommendation()` - Complete hole recommendation with elevation
- `calculateShotDifficulty()` - Difficulty rating based on conditions

### Types

All weather types are defined in `types/weather.ts`:
- `WeatherData` - Current weather conditions
- `WeatherForecastDay` - Daily forecast
- `HourlyForecast` - Hourly forecast
- `WeatherImpact` - Impact breakdown for shot adjustments
- `WeatherAlert` - Weather alerts
- `ElevationData` - Elevation information
- `LocationCoordinates` - Lat/lon coordinates

### Components

#### `WeatherCard`
Displays current weather conditions with optional impact display.

```tsx
import { WeatherCard } from '@/components/weather';

<WeatherCard
  weather={weatherData}
  showImpact={true}
  impactYards={-5}
  className="mb-4"
/>
```

**Props:**
- `weather: WeatherData` - Current weather data (required)
- `showImpact?: boolean` - Show impact yards (default: false)
- `impactYards?: number` - Total impact in yards (default: 0)
- `className?: string` - Additional CSS classes

#### `WindIndicator`
Shows wind speed, direction with compass and optional shot analysis.

```tsx
import { WindIndicator } from '@/components/weather';

<WindIndicator
  speed={12}
  direction={180}
  impactYards={-5}
  shotDirection={90}
  className="mb-4"
/>
```

**Props:**
- `speed: number` - Wind speed in mph (required)
- `direction: number` - Wind direction in degrees, 0=North (required)
- `impactYards?: number` - Wind impact in yards
- `shotDirection?: number` - Shot direction for relative wind calculation
- `className?: string` - Additional CSS classes

#### `WeatherForecast`
7-day and hourly forecast with tabs.

```tsx
import { WeatherForecast } from '@/components/weather';

<WeatherForecast
  location={{ latitude: 40.7128, longitude: -74.0060 }}
  days={7}
  showHourly={true}
  className="mb-4"
/>
```

**Props:**
- `location: LocationCoordinates` - Course location (required)
- `days?: number` - Number of days to show (default: 7)
- `showHourly?: boolean` - Show hourly tab (default: false)
- `className?: string` - Additional CSS classes

#### `WeatherImpactDisplay`
Detailed breakdown of weather impact on shot distance.

```tsx
import { WeatherImpactDisplay } from '@/components/weather';

<WeatherImpactDisplay
  impact={weatherImpact}
  baseDistance={150}
  className="mb-4"
/>
```

**Props:**
- `impact: WeatherImpact` - Impact calculation (required)
- `baseDistance?: number` - Base club distance
- `className?: string` - Additional CSS classes

### Hooks

#### `useWeather`
React hook for weather data with auto-refresh.

```tsx
import { useWeather } from '@/hooks/useWeather';

const { weather, loading, error, refresh, lastUpdated } = useWeather({
  location: { latitude: 40.7128, longitude: -74.0060 },
  refreshInterval: 15 * 60 * 1000, // 15 minutes
  autoRefresh: true
});
```

**Options:**
- `location: LocationCoordinates | null` - Location to fetch weather for
- `refreshInterval?: number` - Auto-refresh interval in ms (default: 15 min)
- `autoRefresh?: boolean` - Enable auto-refresh (default: true)

**Returns:**
- `weather: WeatherData | null` - Current weather data
- `loading: boolean` - Loading state
- `error: string | null` - Error message if any
- `refresh: () => Promise<void>` - Manual refresh function
- `lastUpdated: Date | null` - Last update timestamp

## Usage Examples

### Basic Weather Display

```tsx
'use client';

import { useState, useEffect } from 'react';
import { WeatherCard, WindIndicator } from '@/components/weather';
import { getCurrentWeather } from '@/services/weatherService';

export default function CoursePage() {
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    async function fetchWeather() {
      const data = await getCurrentWeather(40.7128, -74.0060);
      setWeather(data);
    }
    fetchWeather();
  }, []);

  if (!weather) return <div>Loading weather...</div>;

  return (
    <div>
      <WeatherCard weather={weather} />
      <WindIndicator
        speed={weather.windSpeed}
        direction={weather.windDirection}
      />
    </div>
  );
}
```

### Club Recommendation with Weather

```tsx
import { getCurrentWeather } from '@/services/weatherService';
import { recommendClubForDistance } from '@/services/recommendationService';
import { WeatherImpactDisplay } from '@/components/weather';

async function getRecommendation() {
  const weather = await getCurrentWeather(40.7128, -74.0060);
  const clubs = [...]; // User's clubs

  const recommendation = recommendClubForDistance(
    150, // target distance
    clubs,
    weather,
    20, // elevation in feet
    90 // shot direction in degrees
  );

  return (
    <div>
      <h3>Recommended Club: {recommendation.club.name}</h3>
      <p>Adjusted Distance: {recommendation.adjustedDistance} yards</p>
      <WeatherImpactDisplay
        impact={recommendation.impact}
        baseDistance={recommendation.club.carryYards}
      />
    </div>
  );
}
```

### Weather Forecast Display

```tsx
import { WeatherForecast } from '@/components/weather';

export default function CourseDetailPage({ course }) {
  return (
    <div>
      <h1>{course.name}</h1>
      <WeatherForecast
        location={{
          latitude: course.latitude,
          longitude: course.longitude
        }}
        days={7}
        showHourly={true}
      />
    </div>
  );
}
```

### Complete Round Tracking with Weather

```tsx
'use client';

import { useWeather } from '@/hooks/useWeather';
import { WeatherCard, WindIndicator } from '@/components/weather';
import { calculateWeatherImpact } from '@/services/recommendationService';

export default function RoundTracking({ courseLocation }) {
  const { weather, loading, refresh } = useWeather({
    location: courseLocation,
    refreshInterval: 15 * 60 * 1000, // 15 minutes
    autoRefresh: true
  });

  if (loading) return <div>Loading conditions...</div>;

  const impact = calculateWeatherImpact(
    150, // base distance
    weather,
    0, // elevation
    90 // shot direction
  );

  return (
    <div>
      <button onClick={refresh}>Refresh Weather</button>

      <WeatherCard
        weather={weather}
        showImpact={true}
        impactYards={impact.totalAdjustment}
      />

      <WindIndicator
        speed={weather.windSpeed}
        direction={weather.windDirection}
        impactYards={impact.windImpactYards}
        shotDirection={90}
      />
    </div>
  );
}
```

## Weather Impact Calculations

### Wind Effect
- **Formula**: `windSpeed * cos(relativeAngle) * 0.8`
- **Headwind** (0°): Full negative impact
- **Tailwind** (180°): Full positive impact
- **Crosswind** (90°/270°): Minimal distance impact

### Temperature Effect
- **Baseline**: 70°F
- **Formula**: `(temperature - 70) / 10` yards
- **Cold air** (< 70°F): Ball travels less
- **Hot air** (> 70°F): Ball travels more

### Humidity Effect
- **Baseline**: 50% humidity
- **Formula**: `-(humidity - 50) / 10` yards (when humidity > 50%)
- **High humidity**: Ball travels less

### Elevation Effect
- **Formula**: `elevation / 100` yards
- **Uphill** (positive elevation): Add yards
- **Downhill** (negative elevation): Subtract yards

### Total Adjustment
Sum of all effects with recommendations:
- **±8-14 yards**: Use one club more/less
- **±15+ yards**: Use multiple clubs more/less

## Caching Strategy

### Weather Cache
- **Duration**: 15 minutes
- **Storage**: In-memory Map (client-side)
- **Key Format**: `weather_{lat}_{lon}`
- **Automatic**: Yes, on every API call

### Elevation Cache
- **Duration**: 24 hours
- **Storage**: In-memory Map (client-side)
- **Key Format**: `elevation_{lat}_{lon}`
- **Rationale**: Elevation doesn't change

### Production Recommendations
For production, replace in-memory cache with:
- **Redis** - For server-side caching
- **Vercel Edge Config** - For edge caching
- **IndexedDB** - For client-side persistence

## Error Handling

All services include error handling:
- API failures return `null` or empty arrays
- Errors are logged to console
- Components handle null/empty gracefully
- Fallback UI for missing data

## Performance Optimization

### Reduce API Calls
1. **Caching** - 15-minute weather cache
2. **Batch requests** - Fetch weather once per page load
3. **Location rounding** - Round coordinates to 4 decimals
4. **Conditional fetching** - Only fetch when location changes

### Free Tier Management
With 1,000 calls/day:
- **Per user**: 10 weather requests/day
- **Supports**: ~100 active users/day
- **With caching**: Can support more users

### Upgrade Considerations
Upgrade to OpenWeatherMap paid plan when:
- Exceeding 1,000 calls/day
- Need weather alerts
- Need minute-by-minute forecasts
- Need historical data

## Testing

### Manual Testing Checklist

✅ Weather data loads correctly
✅ Location detection works (if implemented)
✅ Weather affects club calculations
✅ Caching reduces API calls (check Network tab)
✅ Forecast displays properly
✅ Updates automatically (15-minute interval)
✅ Error handling for API failures
✅ Offline graceful degradation
✅ Wind direction indicator rotates correctly
✅ Impact calculations are accurate

### Test Locations

**Testing different conditions:**
- **Phoenix, AZ** (33.4484, -112.0740) - Hot, dry
- **Seattle, WA** (47.6062, -122.3321) - Cool, wet
- **Denver, CO** (39.7392, -104.9903) - High elevation
- **Miami, FL** (25.7617, -80.1918) - High humidity
- **Chicago, IL** (41.8781, -87.6298) - Windy conditions

## Troubleshooting

### Weather not loading
1. Check API key in `.env.local`
2. Verify API key is active on OpenWeatherMap
3. Check browser console for errors
4. Verify coordinates are valid

### API rate limit exceeded
1. Check cache is working (15-minute duration)
2. Reduce refresh frequency
3. Consider upgrading OpenWeatherMap plan
4. Implement user-level rate limiting

### Incorrect distances
1. Verify club distances are accurate
2. Check weather data is recent
3. Verify elevation calculations
4. Review shot direction (0-360 degrees)

### Wind indicator not rotating
1. Check wind direction is 0-360
2. Verify CSS transform is applied
3. Check browser dev tools for CSS issues

## Future Enhancements

### Planned Features
- [ ] Weather alerts integration (requires paid plan)
- [ ] Historical weather data
- [ ] Course-specific wind patterns
- [ ] Predictive weather analysis
- [ ] Weather-based playing tips
- [ ] Integration with round scoring
- [ ] Weather widgets on mobile app
- [ ] Push notifications for weather changes

### API Alternatives
If OpenWeatherMap doesn't meet needs:
- **Weather.gov** (US only, free, no key required)
- **Weatherstack** (Free tier: 1,000 calls/month)
- **Visual Crossing** (Free tier: 1,000 calls/day)
- **Tomorrow.io** (Free tier: 500 calls/day)

## Support

For issues or questions:
1. Check this documentation
2. Review console errors
3. Check OpenWeatherMap API status
4. Contact support team

## License

Weather integration uses:
- **OpenWeatherMap API** - See their [terms of service](https://openweathermap.org/terms)
- **Open-Elevation API** - Free, no restrictions
