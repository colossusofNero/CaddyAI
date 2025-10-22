/**
 * Testimonials Data
 * Real user testimonials for CaddyAI
 */

export interface Testimonial {
  id: string;
  quote: string;
  name: string;
  handicap: string;
  location: string;
  photo?: string;
  rating: number;
}

export const testimonials: Testimonial[] = [
  {
    id: '1',
    quote:
      "CaddyAI has completely changed how I approach the course. The club recommendations are spot-on, and I've lowered my handicap by 4 strokes in just two months!",
    name: 'Michael Chen',
    handicap: '12 HCP',
    location: 'San Francisco, CA',
    rating: 5,
  },
  {
    id: '2',
    quote:
      "As a beginner, CaddyAI has been invaluable. It's like having a professional caddy in my pocket, helping me understand which club to use for every situation.",
    name: 'Sarah Thompson',
    handicap: '24 HCP',
    location: 'Austin, TX',
    rating: 5,
  },
  {
    id: '3',
    quote:
      "The wind and elevation adjustments are incredibly accurate. I've gained so much confidence in my club selection, especially on unfamiliar courses.",
    name: 'James Rodriguez',
    handicap: '8 HCP',
    location: 'Phoenix, AZ',
    rating: 5,
  },
  {
    id: '4',
    quote:
      "I love how CaddyAI learns my shot patterns. The more I use it, the better the recommendations get. It's truly personalized to my game.",
    name: 'Emily Watson',
    handicap: '16 HCP',
    location: 'Charlotte, NC',
    rating: 5,
  },
  {
    id: '5',
    quote:
      "The interface is so clean and easy to use, even during a round. Quick recommendations without slowing down play. My foursome all uses it now!",
    name: 'David Park',
    handicap: '10 HCP',
    location: 'Seattle, WA',
    rating: 5,
  },
  {
    id: '6',
    quote:
      "CaddyAI helped me understand my actual club distances vs. what I thought they were. Game changer for course management!",
    name: 'Lisa Martinez',
    handicap: '18 HCP',
    location: 'Miami, FL',
    rating: 5,
  },
];
