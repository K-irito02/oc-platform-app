import { useTranslation } from 'react-i18next';
import { Github, Twitter, Linkedin, Quote, Calendar, Shield, Mail } from 'lucide-react';
import { SiteLogo } from '@/components/SiteLogo';
import { useAppSelector } from '@/store/hooks';

const extractPoliceCode = (policeBeian: string): string | null => {
  if (!policeBeian) return null;
  const match = policeBeian.match(/\d+/);
  return match ? match[0] : null;
};

export const Footer = () => {
  const { t, i18n } = useTranslation();
  const siteConfig = useAppSelector((state) => state.siteConfig.config);
  const isEn = i18n.language === 'en-US' || i18n.language === 'en';

  const policeBeian = siteConfig.footerPoliceBeian;
  const policeIconUrl = siteConfig.footerPoliceIconUrl;
  const icp = siteConfig.footerIcp;
  const holiday = isEn ? siteConfig.footerHolidayEn : siteConfig.footerHoliday;
  const quote = isEn ? siteConfig.footerQuoteEn : siteConfig.footerQuote;
  const quoteAuthor = isEn ? siteConfig.footerQuoteAuthorEn : siteConfig.footerQuoteAuthor;

  const policeCode = extractPoliceCode(policeBeian);
  const policeBeianUrl = policeCode 
    ? `https://beian.gov.cn/portal/registerSystemInfo?recordcode=${policeCode}` 
    : null;

  // 社交链接配置
  const socialLinks = {
    github: siteConfig.socialGithub,
    twitter: siteConfig.socialTwitter,
    linkedin: siteConfig.socialLinkedin,
    email: siteConfig.socialEmail,
  };

  const footerLinks = {
    site: [
      { name: t('footer.products'), href: '/products' },
      { name: t('footer.featured'), href: '/#featured' },
      { name: t('footer.feedback'), href: '/#feedback' },
      { name: t('footer.changelog'), href: '/changelog' },
    ],
    resources: [
      { name: t('footer.documentation'), href: '/coming-soon' },
      { name: t('footer.apiReference'), href: '/developers' },
      { name: t('footer.helpCenter'), href: '/coming-soon' },
      { name: t('footer.openSource'), href: '/coming-soon' },
    ],
    statement: [
      { name: t('footer.about'), href: '/about' },
      { name: t('footer.freeStatement'), href: '/about#free' },
      { name: t('footer.privacyPolicy'), href: '/privacy' },
      { name: t('footer.termsOfService'), href: '/terms' },
    ],
  };

  return (
    <footer className="bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center mb-4">
              <SiteLogo size="md" showText textClassName="text-xl" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-3 max-w-xs">
              {t('footer.siteDesc')}
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 max-w-xs">
              {t('footer.siteNote')}
            </p>
            <div className="flex space-x-4">
              {socialLinks.github && (
                <a href={socialLinks.github} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                  <Github size={20} />
                </a>
              )}
              {socialLinks.twitter && (
                <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                  <Twitter size={20} />
                </a>
              )}
              {socialLinks.linkedin && (
                <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                  <Linkedin size={20} />
                </a>
              )}
              {socialLinks.email && (
                <a href={`mailto:${socialLinks.email}`} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                  <Mail size={20} />
                </a>
              )}
              {!socialLinks.github && !socialLinks.twitter && !socialLinks.linkedin && !socialLinks.email && (
                <>
                  <span className="text-slate-400"><Github size={20} /></span>
                  <span className="text-slate-400"><Twitter size={20} /></span>
                  <span className="text-slate-400"><Linkedin size={20} /></span>
                </>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">{t('footer.site')}</h3>
            <ul className="space-y-3">
              {footerLinks.site.map((link) => (
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
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">{t('footer.statement')}</h3>
            <ul className="space-y-3">
              {footerLinks.statement.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-800 pt-8 space-y-6">
          {/* 节假日定制信息 */}
          {holiday && (
            <div className="flex items-center justify-center gap-2 text-center">
              <Calendar size={16} className="text-rose-500 shrink-0" />
              <p className="text-slate-600 dark:text-slate-300 text-sm font-medium">
                {holiday}
              </p>
            </div>
          )}

          {/* 名人名言 */}
          {quote && (
            <div className="flex flex-col items-center justify-center gap-2 text-center max-w-2xl mx-auto">
              <div className="flex items-start gap-2">
                <Quote size={16} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-slate-500 dark:text-slate-400 text-sm italic">
                  "{quote}"
                </p>
              </div>
              {quoteAuthor && (
                <p className="text-slate-400 dark:text-slate-500 text-xs">
                  — {quoteAuthor}
                </p>
              )}
            </div>
          )}

          {/* 备案信息和版权 - 备案始终居中 */}
          <div className="relative flex items-center justify-center py-4 min-h-[48px]">
            {/* 版权信息 - 绝对定位在左侧 */}
            <p className="absolute left-0 text-slate-500 dark:text-slate-400 text-sm">
              {t('footer.copyright')}
            </p>
            
            {/* 备案信息 - 始终居中，不受主题影响 */}
            {(policeBeian || icp) && (
              <div className="flex flex-wrap items-center justify-center gap-4">
                {policeBeian && policeBeianUrl && (
                  <a 
                    href={policeBeianUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all duration-200"
                  >
                    {policeIconUrl ? (
                      <img src={policeIconUrl} alt="公安备案" className="w-5 h-5" />
                    ) : (
                      <Shield size={18} className="text-red-500" />
                    )}
                    <span className="text-sm text-gray-700 font-medium">{policeBeian}</span>
                  </a>
                )}
                {icp && (
                  <a 
                    href="https://beian.miit.gov.cn/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all duration-200"
                  >
                    <Shield size={18} className="text-blue-500" />
                    <span className="text-sm text-gray-700 font-medium">{icp}</span>
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};
