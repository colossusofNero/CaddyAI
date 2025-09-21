"""
Smart defaults prediction engine for golf recommendations.
Predicts likely conditions, hazard patterns, and auto-adjustments based on
location, weather, altitude, and temperature.
"""

import math
import requests
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass
from datetime import datetime, timezone
import numpy as np
from geopy.geocoders import Nominatim
from geopy.distance import geodesic
import json


@dataclass
class WeatherData:
    """Weather information for golf course"""
    temperature_f: float
    humidity_percent: float
    wind_speed_mph: float
    wind_direction: str
    pressure_inches: float
    visibility_miles: float
    conditions: str
    timestamp: datetime


@dataclass
class CourseConditions:
    """Golf course condition information"""
    elevation_feet: float
    latitude: float
    longitude: float
    green_speed: Optional[float] = None
    fairway_firmness: Optional[str] = None
    rough_thickness: Optional[str] = None
    bunker_conditions: Optional[str] = None


@dataclass
class EnvironmentalFactors:
    """Combined environmental factors affecting golf shots"""
    temperature_adjustment: float  # yards adjustment for temperature
    altitude_adjustment: float     # yards adjustment for altitude
    wind_adjustment: float         # yards adjustment for wind
    humidity_effect: float         # ball flight effect
    pressure_effect: float         # ball flight effect
    overall_distance_modifier: float  # combined multiplier


class SmartDefaultsEngine:
    """Predicts smart defaults for golf recommendations"""

    def __init__(self):
        self.geolocator = Nominatim(user_agent="golf_caddy_ai")
        self.course_database = self._load_course_database()
        self.hazard_patterns = self._load_hazard_patterns()
        self.typical_conditions = self._load_typical_conditions()

    def predict_conditions(self, latitude: float, longitude: float,
                         course_name: Optional[str] = None) -> Dict[str, Any]:
        """Predict likely playing conditions based on location and time"""

        # Get current weather
        weather_data = self._get_weather_data(latitude, longitude)

        # Get course-specific data
        course_data = self._get_course_data(latitude, longitude, course_name)

        # Calculate environmental adjustments
        env_factors = self._calculate_environmental_factors(weather_data, course_data)

        # Predict green conditions
        green_predictions = self._predict_green_conditions(weather_data, course_data)

        # Predict wind patterns
        wind_predictions = self._predict_wind_patterns(weather_data, course_data)

        return {
            "weather": {
                "current_conditions": weather_data.__dict__ if weather_data else None,
                "predicted_changes": self._predict_weather_changes(weather_data)
            },
            "course_conditions": {
                "green_speed": green_predictions["speed"],
                "green_firmness": green_predictions["firmness"],
                "fairway_conditions": self._predict_fairway_conditions(weather_data),
                "rough_conditions": self._predict_rough_conditions(weather_data)
            },
            "environmental_factors": env_factors.__dict__ if env_factors else None,
            "wind_patterns": wind_predictions,
            "recommended_adjustments": self._generate_adjustment_recommendations(env_factors)
        }

    def predict_hazard_patterns(self, course_name: str, hole_number: int = None) -> List[Dict]:
        """Predict common hazard patterns for a course or hole"""

        hazards = []

        # Course-specific hazards from database
        if course_name.lower() in self.hazard_patterns:
            course_hazards = self.hazard_patterns[course_name.lower()]

            if hole_number and str(hole_number) in course_hazards:
                # Hole-specific hazards
                hazards.extend(course_hazards[str(hole_number)])
            else:
                # General course hazards
                hazards.extend(course_hazards.get("general", []))

        # If no specific data, use typical patterns
        if not hazards:
            hazards = self._generate_typical_hazards()

        return hazards

    def auto_adjust_for_conditions(self, base_distance: float, club: str,
                                 environmental_factors: EnvironmentalFactors,
                                 user_skill_level: str = "average") -> Dict[str, Any]:
        """Auto-adjust recommendations based on environmental conditions"""

        # Base adjustment for environmental factors
        adjusted_distance = base_distance * environmental_factors.overall_distance_modifier

        # Additional adjustments by club type
        club_adjustments = self._get_club_specific_adjustments(club, environmental_factors)

        # Skill level adjustments
        skill_adjustments = self._get_skill_level_adjustments(user_skill_level, environmental_factors)

        # Club recommendation adjustments
        recommended_club = self._adjust_club_selection(
            club, adjusted_distance, environmental_factors, user_skill_level
        )

        return {
            "original_distance": base_distance,
            "adjusted_distance": adjusted_distance,
            "total_adjustment": adjusted_distance - base_distance,
            "adjustment_breakdown": {
                "temperature": environmental_factors.temperature_adjustment,
                "altitude": environmental_factors.altitude_adjustment,
                "wind": environmental_factors.wind_adjustment,
                "humidity": environmental_factors.humidity_effect,
                "pressure": environmental_factors.pressure_effect
            },
            "club_adjustments": club_adjustments,
            "skill_adjustments": skill_adjustments,
            "recommended_club": recommended_club,
            "confidence_level": self._calculate_confidence_level(environmental_factors)
        }

    def _get_weather_data(self, latitude: float, longitude: float) -> Optional[WeatherData]:
        """Get current weather data for location"""
        try:
            # This is a placeholder for weather API integration
            # In production, you would use a service like OpenWeatherMap, Weather.gov, etc.

            # Mock weather data based on location and season
            mock_weather = self._generate_mock_weather(latitude, longitude)
            return mock_weather

        except Exception as e:
            print(f"Error fetching weather data: {e}")
            return None

    def _generate_mock_weather(self, latitude: float, longitude: float) -> WeatherData:
        """Generate mock weather data for testing"""
        now = datetime.now(timezone.utc)

        # Temperature varies by latitude and season
        base_temp = 70 - abs(latitude) * 0.5  # Colder at higher latitudes
        seasonal_adjustment = math.sin((now.month - 1) * math.pi / 6) * 20  # Seasonal variation
        temperature = base_temp + seasonal_adjustment

        return WeatherData(
            temperature_f=temperature,
            humidity_percent=60 + np.random.uniform(-20, 20),
            wind_speed_mph=8 + np.random.uniform(-5, 10),
            wind_direction=np.random.choice(["N", "NE", "E", "SE", "S", "SW", "W", "NW"]),
            pressure_inches=29.92 + np.random.uniform(-0.5, 0.5),
            visibility_miles=10,
            conditions="partly_cloudy",
            timestamp=now
        )

    def _get_course_data(self, latitude: float, longitude: float,
                        course_name: Optional[str] = None) -> CourseConditions:
        """Get golf course specific data"""

        # Try to find course in database
        if course_name and course_name.lower() in self.course_database:
            course_data = self.course_database[course_name.lower()]
            return CourseConditions(**course_data)

        # Estimate elevation based on location
        estimated_elevation = self._estimate_elevation(latitude, longitude)

        return CourseConditions(
            elevation_feet=estimated_elevation,
            latitude=latitude,
            longitude=longitude,
            green_speed=10.0,  # Default stimpmeter reading
            fairway_firmness="medium",
            rough_thickness="medium"
        )

    def _calculate_environmental_factors(self, weather: Optional[WeatherData],
                                       course: CourseConditions) -> Optional[EnvironmentalFactors]:
        """Calculate environmental factors affecting ball flight"""

        if not weather:
            return None

        # Temperature adjustment (approximately 2 yards per 10°F)
        temp_adjustment = (weather.temperature_f - 70) * 0.2

        # Altitude adjustment (approximately 2% per 1000 feet)
        altitude_adjustment_percent = course.elevation_feet * 0.002
        altitude_adjustment = 0  # Will be applied as multiplier

        # Wind adjustment (simplified - actual would need wind direction vs target)
        wind_adjustment = weather.wind_speed_mph * 0.5  # Rough estimate

        # Humidity effect (high humidity = shorter distance)
        humidity_effect = -0.001 * (weather.humidity_percent - 50)

        # Barometric pressure effect
        pressure_effect = (weather.pressure_inches - 29.92) * 2

        # Combined distance modifier
        overall_modifier = 1 + (altitude_adjustment_percent + humidity_effect +
                              pressure_effect * 0.01)

        return EnvironmentalFactors(
            temperature_adjustment=temp_adjustment,
            altitude_adjustment=altitude_adjustment_percent * 100,  # Convert to yards for display
            wind_adjustment=wind_adjustment,
            humidity_effect=humidity_effect * 100,
            pressure_effect=pressure_effect,
            overall_distance_modifier=overall_modifier
        )

    def _predict_green_conditions(self, weather: WeatherData, course: CourseConditions) -> Dict:
        """Predict green speed and firmness"""

        base_speed = course.green_speed or 10.0

        # Weather effects on green speed
        temp_effect = (weather.temperature_f - 70) * 0.05  # Faster when warmer
        humidity_effect = -weather.humidity_percent * 0.02  # Slower when humid
        wind_effect = weather.wind_speed_mph * 0.1  # Wind dries greens

        predicted_speed = base_speed + temp_effect + humidity_effect + wind_effect
        predicted_speed = max(7, min(14, predicted_speed))  # Clamp to realistic range

        # Firmness prediction
        if weather.humidity_percent > 70:
            firmness = "soft"
        elif weather.humidity_percent < 40 and weather.temperature_f > 75:
            firmness = "firm"
        else:
            firmness = "medium"

        return {
            "speed": round(predicted_speed, 1),
            "firmness": firmness
        }

    def _predict_wind_patterns(self, weather: WeatherData, course: CourseConditions) -> Dict:
        """Predict wind patterns throughout the round"""

        return {
            "current_wind": {
                "speed": weather.wind_speed_mph,
                "direction": weather.wind_direction,
                "gusts": weather.wind_speed_mph * 1.3
            },
            "predicted_changes": {
                "hourly_trend": "increasing" if weather.wind_speed_mph < 10 else "decreasing",
                "direction_shift": self._predict_wind_direction_shift(weather.wind_direction)
            },
            "hole_specific_effects": self._predict_hole_wind_effects(course)
        }

    def _generate_adjustment_recommendations(self, env_factors: EnvironmentalFactors) -> List[str]:
        """Generate human-readable adjustment recommendations"""

        recommendations = []

        # Temperature adjustments
        if env_factors.temperature_adjustment > 2:
            recommendations.append("Ball will fly longer due to warm temperatures - club down")
        elif env_factors.temperature_adjustment < -2:
            recommendations.append("Ball will fly shorter due to cold temperatures - club up")

        # Altitude adjustments
        if env_factors.altitude_adjustment > 5:
            recommendations.append("High altitude will add significant distance - club down")

        # Wind adjustments
        if env_factors.wind_adjustment > 5:
            recommendations.append("Strong winds will affect ball flight - adjust aim and club selection")

        # Humidity effects
        if env_factors.humidity_effect < -1:
            recommendations.append("High humidity may reduce distance slightly")

        return recommendations

    def _get_club_specific_adjustments(self, club: str, env_factors: EnvironmentalFactors) -> Dict:
        """Get club-specific adjustments for environmental factors"""

        club_lower = club.lower()

        # Different clubs are affected differently by conditions
        if "driver" in club_lower or "wood" in club_lower:
            # Woods are more affected by wind and temperature
            wind_multiplier = 1.5
            temp_multiplier = 1.2
        elif "iron" in club_lower:
            # Irons have moderate sensitivity
            wind_multiplier = 1.0
            temp_multiplier = 1.0
        else:  # Wedges, putter
            # Short game clubs less affected
            wind_multiplier = 0.5
            temp_multiplier = 0.8

        return {
            "wind_adjustment": env_factors.wind_adjustment * wind_multiplier,
            "temperature_adjustment": env_factors.temperature_adjustment * temp_multiplier
        }

    def _get_skill_level_adjustments(self, skill_level: str, env_factors: EnvironmentalFactors) -> Dict:
        """Adjust recommendations based on player skill level"""

        skill_multipliers = {
            "beginner": 0.5,    # Beginners less affected by minor conditions
            "average": 1.0,     # Average players get full adjustments
            "advanced": 1.3,    # Advanced players can take advantage of conditions
            "professional": 1.5  # Pros maximize condition advantages
        }

        multiplier = skill_multipliers.get(skill_level, 1.0)

        return {
            "adjustment_multiplier": multiplier,
            "recommended_strategy": self._get_strategy_for_skill_level(skill_level, env_factors)
        }

    def _adjust_club_selection(self, original_club: str, adjusted_distance: float,
                             env_factors: EnvironmentalFactors, skill_level: str) -> str:
        """Suggest club adjustments based on conditions"""

        # Simple club progression for adjustments
        club_progression = [
            "lob wedge", "sand wedge", "gap wedge", "pitching wedge",
            "9-iron", "8-iron", "7-iron", "6-iron", "5-iron", "4-iron",
            "3-iron", "hybrid", "5-wood", "3-wood", "driver"
        ]

        try:
            current_index = club_progression.index(original_club.lower())
        except ValueError:
            return original_club  # Club not in progression

        # Calculate adjustment needed
        total_adjustment = (env_factors.temperature_adjustment +
                          env_factors.altitude_adjustment +
                          env_factors.wind_adjustment)

        # Determine club change (rough estimate: 10-15 yards per club)
        clubs_to_adjust = int(total_adjustment / 12)

        # Clamp to valid range
        new_index = max(0, min(len(club_progression) - 1, current_index - clubs_to_adjust))

        return club_progression[new_index]

    def _calculate_confidence_level(self, env_factors: EnvironmentalFactors) -> float:
        """Calculate confidence level in predictions (0-1)"""

        # Start with high confidence
        confidence = 0.9

        # Reduce confidence for extreme conditions
        if abs(env_factors.temperature_adjustment) > 5:
            confidence -= 0.1
        if env_factors.wind_adjustment > 10:
            confidence -= 0.2
        if abs(env_factors.altitude_adjustment) > 10:
            confidence -= 0.1

        return max(0.3, confidence)  # Minimum confidence of 30%

    def _load_course_database(self) -> Dict:
        """Load golf course database (mock implementation)"""
        return {
            "pebble beach": {
                "elevation_feet": 100,
                "latitude": 36.5697,
                "longitude": -121.9489,
                "green_speed": 12.0,
                "fairway_firmness": "firm"
            },
            "augusta national": {
                "elevation_feet": 400,
                "latitude": 33.5030,
                "longitude": -82.0199,
                "green_speed": 13.0,
                "fairway_firmness": "firm"
            },
            "st andrews": {
                "elevation_feet": 100,
                "latitude": 56.3394,
                "longitude": -2.8066,
                "green_speed": 10.0,
                "fairway_firmness": "firm"
            }
        }

    def _load_hazard_patterns(self) -> Dict:
        """Load common hazard patterns by course (mock implementation)"""
        return {
            "pebble beach": {
                "general": [
                    {"type": "water", "frequency": "high", "holes": [7, 8, 18]},
                    {"type": "rough", "frequency": "medium", "description": "thick coastal rough"},
                    {"type": "wind", "frequency": "high", "description": "coastal winds"}
                ]
            },
            "desert course": {
                "general": [
                    {"type": "desert", "frequency": "high", "description": "desert waste areas"},
                    {"type": "wind", "frequency": "medium", "description": "desert winds"},
                    {"type": "elevation", "frequency": "high", "description": "elevation changes"}
                ]
            }
        }

    def _load_typical_conditions(self) -> Dict:
        """Load typical conditions by region (mock implementation)"""
        return {
            "coastal": {"wind": "high", "humidity": "high", "temperature_variation": "low"},
            "desert": {"wind": "medium", "humidity": "low", "temperature_variation": "high"},
            "mountain": {"wind": "variable", "humidity": "low", "altitude_effect": "high"},
            "inland": {"wind": "low", "humidity": "medium", "temperature_variation": "medium"}
        }

    def _estimate_elevation(self, latitude: float, longitude: float) -> float:
        """Estimate elevation based on coordinates (simplified)"""
        # This is a very rough estimation - in production, use elevation APIs
        # Mountain regions (rough approximation)
        if (40 < latitude < 50 and -120 < longitude < -100):  # Rocky Mountains area
            return 5000 + np.random.uniform(-1000, 3000)
        elif (30 < latitude < 40 and -115 < longitude < -110):  # Southwest desert
            return 3000 + np.random.uniform(-500, 2000)
        else:  # Default to near sea level
            return np.random.uniform(0, 500)

    def _predict_weather_changes(self, weather: WeatherData) -> Dict:
        """Predict how weather might change during round"""
        return {
            "temperature_trend": "stable",  # Could be "rising", "falling", "stable"
            "wind_trend": "increasing" if weather.wind_speed_mph < 8 else "decreasing",
            "precipitation_chance": 20  # Percentage
        }

    def _predict_fairway_conditions(self, weather: WeatherData) -> str:
        """Predict fairway conditions"""
        if weather.humidity_percent > 70:
            return "soft"
        elif weather.humidity_percent < 40 and weather.temperature_f > 80:
            return "firm"
        else:
            return "medium"

    def _predict_rough_conditions(self, weather: WeatherData) -> str:
        """Predict rough conditions"""
        if weather.humidity_percent > 75:
            return "thick and wet"
        elif weather.humidity_percent < 35:
            return "dry and wispy"
        else:
            return "normal thickness"

    def _predict_wind_direction_shift(self, current_direction: str) -> str:
        """Predict how wind direction might shift"""
        direction_map = {
            "N": "NE", "NE": "E", "E": "SE", "SE": "S",
            "S": "SW", "SW": "W", "W": "NW", "NW": "N"
        }
        return direction_map.get(current_direction, current_direction)

    def _predict_hole_wind_effects(self, course: CourseConditions) -> Dict:
        """Predict how wind affects specific holes"""
        return {
            "exposed_holes": "Holes 1, 9, 18 typically most affected by wind",
            "sheltered_holes": "Holes in trees or valleys less affected",
            "crosswind_holes": "Par 3s and long par 4s most affected by crosswinds"
        }

    def _generate_typical_hazards(self) -> List[Dict]:
        """Generate typical hazards when no course-specific data available"""
        return [
            {"type": "water", "frequency": "medium", "description": "water hazards"},
            {"type": "bunker", "frequency": "high", "description": "sand bunkers"},
            {"type": "rough", "frequency": "high", "description": "thick rough"},
            {"type": "trees", "frequency": "medium", "description": "tree-lined fairways"}
        ]

    def _get_strategy_for_skill_level(self, skill_level: str, env_factors: EnvironmentalFactors) -> str:
        """Get playing strategy recommendation based on skill level"""

        strategies = {
            "beginner": "Focus on consistent contact and safe targets",
            "average": "Make moderate adjustments for conditions",
            "advanced": "Take advantage of favorable conditions, adjust aggressively",
            "professional": "Maximize all environmental factors for optimal performance"
        }

        return strategies.get(skill_level, "Play within your comfort zone")