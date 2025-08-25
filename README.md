# CaddyAI v2.3 - Hazard-Aware Golf Shot Planner

A sophisticated golf shot planning application with advanced hazard analysis, conversational tee geometry, and voice interaction capabilities.

## What's New in v2.3

- **Automatic Layup Suggestion**: When directional hazard bands (e.g., right bunker 250–265y) combined with narrow fairways create high-risk scenarios, the model automatically adds pre-hazard layup plans
- **Driver-Only Fairway Width Penalty**: Fairway width constraints apply specifically to driver shots for more realistic tee strategy
- **Enhanced Voice Commands**: Natural language processing for hazard descriptions and course conditions
- **Self-Testing Framework**: Built-in validation ensures mathematical models work correctly

## Key Features

### Advanced Shot Analysis
- **Physics-Based Calculations**: Accounts for temperature, altitude, elevation, wind, lie conditions, and stance
- **Risk Assessment**: Personalized risk appetite based on handicap and confidence levels
- **Hazard-Aware Planning**: Sophisticated modeling of directional hazards and fairway geometry

### Conversational Interface
- **Voice Commands**: "hazard right 250 clear 265", "fairway width 15", "what's the play?"
- **Text-to-Speech**: Automatic reading of recommendations
- **Natural Language**: Intuitive course condition input

### Intelligent Recommendations
- **Primary & Backup Clubs**: Always provides alternatives
- **Layup Logic**: Automatic pre-hazard positioning when warranted
- **Next Shot Planning**: Seamless progression through the hole

### Player Personalization
- **Custom Player Model (PPM)**: Personalized performance metrics for each club
- **Confidence Tracking**: Real-time confidence affects risk calculations
- **Preferred Shot Shapes**: Accounts for natural ball flight tendencies

## Technical Implementation

### Mathematical Foundation
- **Error Function Approximation**: Abramowitz & Stegun implementation for normal distribution calculations
- **Probability Modeling**: Sophisticated risk assessment using statistical methods
- **Optimization**: Expected strokes minimization across all viable options

### Architecture
- **React 18** with TypeScript for type safety
- **Tailwind CSS** for responsive, modern UI
- **Web Speech API** for voice interaction
- **Real-time Calculations** with useMemo optimization

## Usage

### Basic Operation
1. Set distance to hole and course conditions
2. Input hazard information (side, start/clear distances, fairway width)
3. Review primary and backup recommendations
4. Use voice commands for quick updates

### Voice Commands
- **Hazards**: "hazard right 250 clear 265"
- **Fairway**: "fairway width 15" or "fairway narrows to 20"
- **Conditions**: "lie fairway", "pin front", "confidence 4"
- **Recommendations**: "what's the play?" or "what should I hit?"

### Tee Strategy
When on the tee, the app provides:
- **Attack Options**: Full driver/3-wood shots with risk assessment
- **Layup Plans**: Pre-hazard positioning when conditions warrant
- **Fairway Geometry**: Width-based penalties for driver shots

## Self-Testing

The application includes comprehensive self-tests that validate:
- Mathematical functions (error function, normal CDF)
- Probability calculations (hazard bands, fairway geometry)
- Risk assessment logic
- Layup vs. attack decision making

## Deployment

Ready for immediate deployment to:
- **Vercel**: Optimized build configuration included
- **Netlify**: Static site generation compatible
- **GitHub Pages**: Standard React deployment

## Future Enhancements

- **Strokes Gained Integration**: Replace toy model with real SG data
- **Course Database**: Integration with course management systems
- **Weather API**: Real-time condition updates
- **Shot Tracking**: Performance analytics and learning

## Technical Notes

- Uses portable mathematical approximations (no external math libraries)
- Responsive design works on mobile and desktop
- Voice features work best in Chrome/Android (iOS Safari requires user interaction)
- All calculations run client-side for instant feedback

This application represents a significant advancement in golf strategy technology, combining sophisticated mathematical modeling with intuitive user interaction for practical on-course decision making.