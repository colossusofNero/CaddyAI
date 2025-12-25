/**
 * Badge System & Gamification
 * Incentivize user engagement with achievements and rewards
 */

'use client';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
}

const badges: Badge[] = [
  {
    id: 'early_adopter',
    name: 'Early Adopter',
    description: 'One of the first 10,000 Copperline Golf users',
    icon: '🚀',
    unlocked: true,
  },
  {
    id: 'first_round',
    name: 'First Round',
    description: 'Complete your first round with Copperline Golf',
    icon: '⛳',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
  },
  {
    id: 'consistency_king',
    name: 'Consistency King',
    description: 'Log 10 consecutive rounds',
    icon: '👑',
    unlocked: false,
    progress: 3,
    maxProgress: 10,
  },
  {
    id: 'club_master',
    name: 'Club Master',
    description: 'Track all 14 clubs in your bag',
    icon: '🏌️',
    unlocked: false,
    progress: 9,
    maxProgress: 14,
  },
  {
    id: 'weather_warrior',
    name: 'Weather Warrior',
    description: 'Play in 5 different weather conditions',
    icon: '🌦️',
    unlocked: false,
    progress: 2,
    maxProgress: 5,
  },
  {
    id: 'course_explorer',
    name: 'Course Explorer',
    description: 'Play at 10 different courses',
    icon: '🗺️',
    unlocked: false,
    progress: 4,
    maxProgress: 10,
  },
];

export function BadgeSystem() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">Your Achievements</h2>
        <p className="text-text-secondary">Unlock badges as you use Copperline Golf and improve your game</p>
      </div>

      {/* Badge Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {badges.map((badge) => (
          <Card
            key={badge.id}
            variant={badge.unlocked ? 'default' : 'elevated'}
            padding="lg"
            className={badge.unlocked ? 'border-2 border-primary' : 'opacity-75'}
          >
            <div className="flex items-start gap-4">
              <div className={`text-4xl ${!badge.unlocked && 'grayscale opacity-50'}`}>
                {badge.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-text-primary mb-1">{badge.name}</h3>
                <p className="text-sm text-text-secondary mb-3">{badge.description}</p>

                {badge.unlocked ? (
                  <div className="flex items-center gap-2 text-success text-sm font-medium">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Unlocked
                  </div>
                ) : badge.progress !== undefined && badge.maxProgress !== undefined ? (
                  <div>
                    <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
                      <span>Progress</span>
                      <span>
                        {badge.progress}/{badge.maxProgress}
                      </span>
                    </div>
                    <div className="w-full bg-secondary-700 rounded-full h-2">
                      <div
                        className="bg-primary rounded-full h-2 transition-all duration-300"
                        style={{ width: `${(badge.progress / badge.maxProgress) * 100}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-text-secondary">Locked</div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Referral Program Component
export function ReferralProgram() {
  const referralCode = 'CADDY2025';
  const referralsCount = 2;
  const referralsNeeded = 3;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(`https://copperlinegolf.com/signup?ref=${referralCode}`);
    // Show toast notification in production
    alert('Referral link copied to clipboard!');
  };

  const handleShare = (platform: string) => {
    const url = encodeURIComponent(`https://copperlinegolf.com/signup?ref=${referralCode}`);
    const text = encodeURIComponent('Check out Copperline Golf - the AI golf caddy that helped me lower my scores!');

    const shareUrls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      email: `mailto:?subject=Try Copperline Golf&body=${text} ${url}`,
    };

    window.open(shareUrls[platform], '_blank', 'width=600,height=400');
  };

  return (
    <Card variant="elevated" padding="lg" className="border-2 border-primary">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-primary bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">Refer Friends, Get Rewards</h2>
        <p className="text-text-secondary">Invite 3 friends and get 1 month free</p>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-text-secondary mb-2">
          <span>Your Progress</span>
          <span className="font-bold text-primary">
            {referralsCount}/{referralsNeeded} referrals
          </span>
        </div>
        <div className="w-full bg-secondary-700 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-primary to-primary-600 rounded-full h-3 transition-all duration-500"
            style={{ width: `${(referralsCount / referralsNeeded) * 100}%` }}
          />
        </div>
        <p className="text-xs text-text-secondary mt-2">
          {referralsNeeded - referralsCount} more referral{referralsNeeded - referralsCount !== 1 ? 's' : ''} to unlock
          your reward!
        </p>
      </div>

      {/* Referral Code */}
      <div className="bg-secondary-700 rounded-lg p-4 mb-6">
        <label className="text-xs text-text-secondary mb-2 block">Your Referral Link</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={`https://copperlinegolf.com/signup?ref=${referralCode}`}
            readOnly
            className="flex-1 bg-secondary text-text-primary px-3 py-2 rounded-lg text-sm"
          />
          <Button onClick={handleCopyCode} size="sm">
            Copy
          </Button>
        </div>
      </div>

      {/* Share Buttons */}
      <div>
        <label className="text-sm text-text-secondary mb-3 block">Share on social media</label>
        <div className="grid grid-cols-4 gap-3">
          <button
            onClick={() => handleShare('twitter')}
            className="bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white p-3 rounded-lg transition-colors"
            title="Share on Twitter"
          >
            <svg className="w-5 h-5 mx-auto" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
            </svg>
          </button>
          <button
            onClick={() => handleShare('facebook')}
            className="bg-[#4267B2] hover:bg-[#365899] text-white p-3 rounded-lg transition-colors"
            title="Share on Facebook"
          >
            <svg className="w-5 h-5 mx-auto" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
            </svg>
          </button>
          <button
            onClick={() => handleShare('linkedin')}
            className="bg-[#0077b5] hover:bg-[#006399] text-white p-3 rounded-lg transition-colors"
            title="Share on LinkedIn"
          >
            <svg className="w-5 h-5 mx-auto" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" />
              <circle cx="4" cy="4" r="2" />
            </svg>
          </button>
          <button
            onClick={() => handleShare('email')}
            className="bg-secondary-700 hover:bg-secondary-600 text-text-primary p-3 rounded-lg transition-colors"
            title="Share via Email"
          >
            <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Rewards List */}
      <div className="mt-6 pt-6 border-t border-secondary-700">
        <h3 className="font-bold text-text-primary mb-3 text-sm">Referral Rewards</h3>
        <ul className="space-y-2 text-sm text-text-secondary">
          <li className="flex items-center gap-2">
            <svg className="w-4 h-4 text-success" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            3 referrals = 1 month free
          </li>
          <li className="flex items-center gap-2">
            <span className="w-4 h-4" />
            5 referrals = 2 months free + exclusive badge
          </li>
          <li className="flex items-center gap-2">
            <span className="w-4 h-4" />
            10 referrals = 6 months free + VIP support
          </li>
        </ul>
      </div>
    </Card>
  );
}
