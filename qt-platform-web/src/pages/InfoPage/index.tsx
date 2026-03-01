import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

type SectionItem = {
  id?: string;
  title: string;
  body: string;
};

type PageContent = {
  title: string;
  lead: string;
  sections?: SectionItem[];
  items?: string[];
};

export default function InfoPage() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const pageKey = pathname.replace('/', '');

  const aboutSections = t('footerPages.about.sections', { returnObjects: true }) as SectionItem[];
  const privacyItems = t('footerPages.privacy.items', { returnObjects: true }) as string[];
  const termsItems = t('footerPages.terms.items', { returnObjects: true }) as string[];
  const changelogItems = t('footerPages.changelog.items', { returnObjects: true }) as string[];

  const pages: Record<string, PageContent> = {
    about: {
      title: t('footerPages.about.title'),
      lead: t('footerPages.about.lead'),
      sections: aboutSections,
    },
    privacy: {
      title: t('footerPages.privacy.title'),
      lead: t('footerPages.privacy.lead'),
      items: privacyItems,
    },
    terms: {
      title: t('footerPages.terms.title'),
      lead: t('footerPages.terms.lead'),
      items: termsItems,
    },
    changelog: {
      title: t('footerPages.changelog.title'),
      lead: t('footerPages.changelog.lead'),
      items: changelogItems,
    },
  };

  const content = pages[pageKey] ?? pages.about;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
          {content.title}
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-lg">
          {content.lead}
        </p>

        {content.sections && (
          <div className="grid gap-6 md:grid-cols-2 mt-10">
            {content.sections.map((section) => (
              <div
                key={section.title}
                id={section.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-6"
              >
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  {section.title}
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  {section.body}
                </p>
              </div>
            ))}
          </div>
        )}

        {content.items && (
          <ul className="mt-10 space-y-3 text-slate-600 dark:text-slate-400">
            {content.items.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-blue-500" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
