import { useTranslation } from 'react-i18next';
import { Github, Twitter, Linkedin, Quote, Calendar, Mail, MessageCircle, MessageSquare } from 'lucide-react';
import { SiteLogo } from '../SiteLogo';
import { useAppSelector } from '@/store/hooks';

export const Footer = () => {
  const { t, i18n } = useTranslation();
  const siteConfig = useAppSelector((state) => state.siteConfig.config);
  const isEn = i18n.language === 'en-US' || i18n.language === 'en';

  const holiday = isEn ? siteConfig.footerHolidayEn : siteConfig.footerHoliday;
  const quote = isEn ? siteConfig.footerQuoteEn : siteConfig.footerQuote;
  const quoteAuthor = isEn ? siteConfig.footerQuoteAuthorEn : siteConfig.footerQuoteAuthor;

  const socialLinks = {
    github: siteConfig.socialGithub,
    twitter: siteConfig.socialTwitter,
    linkedin: siteConfig.socialLinkedin,
    weibo: siteConfig.socialWeibo,
    wechat: siteConfig.socialWechat,
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

  const policeFilingConfig = {
    enabled: true,
    number: '贵公网安备52062302000156号',
    url: 'https://beian.mps.gov.cn/#/query/webSearch?code=52062302000156',
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
                <a href={socialLinks.github} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors" title="GitHub">
                  <Github size={20} />
                </a>
              )}
              {socialLinks.twitter && (
                <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors" title="Twitter / X">
                  <Twitter size={20} />
                </a>
              )}
              {socialLinks.linkedin && (
                <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors" title="LinkedIn">
                  <Linkedin size={20} />
                </a>
              )}
              {socialLinks.weibo && (
                <a href={socialLinks.weibo} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors" title={t('footer.weibo') || '微博'}>
                  <MessageCircle size={20} />
                </a>
              )}
              {socialLinks.wechat && (
                <span className="text-slate-400 cursor-pointer hover:text-slate-600 dark:hover:text-slate-300 transition-colors" title={t('footer.wechat') || '微信公众号'}>
                  <MessageSquare size={20} />
                </span>
              )}
              {socialLinks.email && (
                <a href={`mailto:${socialLinks.email}`} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors" title={t('footer.contactEmail') || '联系邮箱'}>
                  <Mail size={20} />
                </a>
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
          {holiday && (
            <div className="flex items-center justify-center gap-2 text-center">
              <Calendar size={16} className="text-rose-500 shrink-0" />
              <p className="text-slate-600 dark:text-slate-300 text-sm font-medium">
                {holiday}
              </p>
            </div>
          )}

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

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 py-4">
            <p className="text-slate-500 dark:text-slate-400 text-sm text-center">
              {t('footer.copyright')}
            </p>
            
            <div className="hidden sm:block text-slate-300 dark:text-slate-700">|</div>
            
            <a 
              href="https://beian.miit.gov.cn/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-slate-500 dark:text-slate-400 text-sm hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              黔ICP备2026002901号-1
            </a>
            
            <div className="hidden sm:block text-slate-300 dark:text-slate-700">|</div>
            
            {policeFilingConfig.enabled && policeFilingConfig.url ? (
              <a 
                href={policeFilingConfig.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-sm hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <img 
                  src="/police-filing.png" 
                  alt="公安备案" 
                  className="w-4 h-4"
                />
                <span>{policeFilingConfig.number}</span>
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </footer>
  );
};
