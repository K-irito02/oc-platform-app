import { useTranslation } from 'react-i18next';
import { Github, Twitter, Linkedin } from 'lucide-react';

export const Footer = () => {
  const { t } = useTranslation();

  const footerLinks = {
    product: [
      { name: t('footer.features'), href: '#' },
      { name: t('footer.integrations'), href: '#' },
      { name: t('footer.pricing'), href: '#' },
      { name: t('footer.changelog'), href: '#' },
    ],
    resources: [
      { name: t('footer.documentation'), href: '#' },
      { name: t('footer.apiReference'), href: '#' },
      { name: t('footer.community'), href: '#' },
      { name: t('footer.helpCenter'), href: '#' },
    ],
    company: [
      { name: t('footer.about'), href: '#' },
      { name: t('footer.blog'), href: '#' },
      { name: t('footer.careers'), href: '#' },
      { name: t('footer.legal'), href: '#' },
    ],
  };

  return (
    <footer className="bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl mr-2">
                Q
              </div>
              <span className="font-bold text-xl text-slate-900 dark:text-white">{t('common.siteName')}</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 max-w-xs">
              {t('footer.siteDesc')}
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                <Github size={20} />
              </a>
              <a href="#" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                <Linkedin size={20} />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">{t('footer.product')}</h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">{t('footer.resources')}</h3>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">{t('footer.company')}</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-4 md:mb-0">
            {t('footer.copyright')}
          </p>
          <div className="flex space-x-6 text-sm">
            <a href="#" className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">{t('footer.privacyPolicy')}</a>
            <a href="#" className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">{t('footer.termsOfService')}</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
