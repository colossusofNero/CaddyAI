'use client';

import { X, Map, MapPin, Star, Search, Navigation, Flag } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { FEATURES } from '@/lib/featureFlags';
import { useState } from 'react';

interface CoursesDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CoursesDatabaseModal({ isOpen, onClose }: CoursesDatabaseModalProps) {
  const t = useTranslations('marketing.modal.courses');
  const tCommon = useTranslations('marketing.modal.modalCommon');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const featuredCourses = [
    { name: 'Pebble Beach Golf Links', location: 'Pebble Beach, CA', rating: 4.9, holes: 18, par: 72, distance: 6828, difficulty: t('difficulty'), image: '🏖️', features: [t('fOceanViews'), t('fGPSMapped'), t('fProTour')] },
    { name: 'Augusta National Golf Club', location: 'Augusta, GA', rating: 5.0, holes: 18, par: 72, distance: 7475, difficulty: t('difficulty'), image: '🌺', features: [t('fMasters'), t('fGPSMapped'), t('fHistoric')] },
    { name: 'St Andrews Links - Old Course', location: 'St Andrews, Scotland', rating: 4.9, holes: 18, par: 72, distance: 7297, difficulty: t('difficulty'), image: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', features: [t('fHistoric'), t('fGPSMapped'), t('fLinks')] },
    { name: 'Pinehurst No. 2', location: 'Pinehurst, NC', rating: 4.8, holes: 18, par: 71, distance: 7588, difficulty: t('difficulty'), image: '🌲', features: [t('fUSOpen'), t('fGPSMapped'), t('fResort')] },
  ];

  const nearbyCourses = [
    { name: 'Spyglass Hill Golf Course', distance: 2.1, rating: 4.7, holes: 18 },
    { name: 'Spanish Bay Golf Links', distance: 3.5, rating: 4.6, holes: 18 },
    { name: 'Poppy Hills Golf Course', distance: 4.2, rating: 4.5, holes: 18 },
    { name: 'Bayonet & Black Horse', distance: 8.7, rating: 4.4, holes: 36 },
  ];

  const databaseStats = [
    { label: t('statTotal'), value: '15,847', icon: Map },
    { label: t('statCountries'), value: '127', icon: MapPin },
    { label: t('statGPS'), value: '12,403', icon: Navigation },
    { label: t('statHoles'), value: '287K+', icon: Flag },
  ];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 bg-white border-2 border-primary rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto p-8 animate-scale-in">
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-900" aria-label={tCommon('closeAria')}>
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-primary bg-opacity-20 rounded-full flex items-center justify-center">
            <Map className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">{t('title')}</h2>
            <p className="text-gray-600">{t('subtitle')}</p>
          </div>
        </div>

        {/* Database Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {databaseStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <Icon className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-3xl font-bold text-blue-900">{stat.value}</p>
                <p className="text-xs text-blue-700 mt-1">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none text-gray-900"
            />
          </div>
        </div>

        {/* Featured Courses */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">{t('featured')}</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {featuredCourses.map((course) => (
              <div key={course.name} className="bg-gray-50 rounded-xl p-5 border-2 border-gray-200 hover:border-primary transition-all cursor-pointer">
                <div className="flex items-start gap-4 mb-3">
                  <div className="text-4xl">{course.image}</div>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-gray-900 mb-1">{course.name}</h4>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <MapPin className="w-4 h-4" />
                      <span>{course.location}</span>
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-bold text-gray-900">{course.rating}</span>
                      <span className="text-xs text-gray-600 ml-1">({course.holes} holes)</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                  <div className="bg-white rounded-lg p-2">
                    <p className="text-xs text-gray-600">{t('par')}</p>
                    <p className="text-lg font-bold text-primary">{course.par}</p>
                  </div>
                  <div className="bg-white rounded-lg p-2">
                    <p className="text-xs text-gray-600">{t('yards')}</p>
                    <p className="text-lg font-bold text-primary">{course.distance}</p>
                  </div>
                  <div className="bg-white rounded-lg p-2">
                    <p className="text-xs text-gray-600">{t('level')}</p>
                    <p className="text-[10px] font-bold text-primary">{course.difficulty}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {course.features.map((feature) => (
                    <span key={feature} className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Nearby Courses */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">{t('nearby')}</h3>
            <button className="text-sm text-primary font-semibold hover:underline">{t('viewAll')}</button>
          </div>
          <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">{t('colName')}</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">{t('colDistance')}</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">{t('colRating')}</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">{t('colHoles')}</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">{t('colAction')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {nearbyCourses.map((course) => (
                  <tr key={course.name} className="hover:bg-white transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{course.name}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-sm text-gray-700">
                        <Navigation className="w-3 h-3" />
                        {course.distance} {t('miSuffix')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-sm font-bold text-gray-900">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        {course.rating}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-700">{course.holes}</td>
                    <td className="px-4 py-3 text-center">
                      <button className="text-xs font-semibold text-primary hover:underline">{t('viewDetails')}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-200">
            <Map className="w-8 h-8 text-green-600 mb-3" />
            <h4 className="font-bold text-green-900 mb-2">{t('feat1Title')}</h4>
            <p className="text-sm text-green-800">{t('feat1Body')}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border border-purple-200">
            <Flag className="w-8 h-8 text-purple-600 mb-3" />
            <h4 className="font-bold text-purple-900 mb-2">{t('feat2Title')}</h4>
            <p className="text-sm text-purple-800">{t('feat2Body')}</p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-5 border border-orange-200">
            <Star className="w-8 h-8 text-orange-600 mb-3" />
            <h4 className="font-bold text-orange-900 mb-2">{t('feat3Title')}</h4>
            <p className="text-sm text-orange-800">{t('feat3Body')}</p>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <strong className="font-semibold">{t('growingLabel')}</strong> {t('growingBody')}
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose}>{tCommon('close')}</Button>
          {FEATURES.featureModalCta && (
            <Button variant="primary">{t('cta')}</Button>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes scale-in {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
