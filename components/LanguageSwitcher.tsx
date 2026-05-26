'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { routing, localeNames, type Locale } from '@/i18n/routing';
import { ChevronDown, Check } from 'lucide-react';
import US from 'country-flag-icons/react/3x2/US';
import ES from 'country-flag-icons/react/3x2/ES';
import FR from 'country-flag-icons/react/3x2/FR';
import DE from 'country-flag-icons/react/3x2/DE';
import JP from 'country-flag-icons/react/3x2/JP';
import IT from 'country-flag-icons/react/3x2/IT';
import BR from 'country-flag-icons/react/3x2/BR';
import KR from 'country-flag-icons/react/3x2/KR';
import CN from 'country-flag-icons/react/3x2/CN';
import RU from 'country-flag-icons/react/3x2/RU';
import IN from 'country-flag-icons/react/3x2/IN';

const flagFor: Record<Locale, React.ComponentType<{ className?: string; title?: string }>> = {
  en: US,
  es: ES,
  fr: FR,
  de: DE,
  ja: JP,
  it: IT,
  'pt-BR': BR,
  ko: KR,
  zh: CN,
  ru: RU,
  hi: IN,
};

function Flag({ locale, className }: { locale: Locale; className?: string }) {
  const FlagSvg = flagFor[locale];
  return (
    <FlagSvg
      title={localeNames[locale]}
      className={`inline-block rounded-sm shadow-sm ring-1 ring-black/10 ${className ?? ''}`}
    />
  );
}

interface LanguageSwitcherProps {
  variant?: 'header' | 'mobile';
}

export function LanguageSwitcher({ variant = 'header' }: LanguageSwitcherProps) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  function pick(next: Locale) {
    setOpen(false);
    if (next === locale) return;
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  }

  if (variant === 'mobile') {
    return (
      <div className="space-y-2">
        <div className="text-sm text-text-muted px-1">Language</div>
        <div className="grid grid-cols-2 gap-2">
          {routing.locales.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => pick(l)}
              disabled={isPending}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors touch-manipulation text-left ${
                l === locale
                  ? 'bg-primary/15 text-primary'
                  : 'text-text-secondary hover:bg-secondary-800'
              }`}
              style={{ minHeight: '44px' }}
            >
              <Flag locale={l} className="w-6 h-4 flex-shrink-0" />
              <span className="truncate">{localeNames[l]}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Change language. Current: ${localeNames[locale]}`}
        className="inline-flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-secondary-800/60 transition-colors"
      >
        <Flag locale={locale} className="w-6 h-4 flex-shrink-0" />
        <span className="hidden md:inline">{localeNames[locale]}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute right-0 mt-2 w-56 max-h-80 overflow-auto rounded-xl border border-secondary-700 bg-background-light shadow-xl z-50 py-1"
        >
          {routing.locales.map((l) => (
            <li key={l}>
              <button
                type="button"
                onClick={() => pick(l)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                  l === locale
                    ? 'text-primary bg-primary/10'
                    : 'text-text-secondary hover:text-text-primary hover:bg-secondary-800'
                }`}
              >
                <Flag locale={l} className="w-6 h-4 flex-shrink-0" />
                <span className="flex-1 text-left truncate">{localeNames[l]}</span>
                {l === locale && <Check className="w-4 h-4 flex-shrink-0" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
