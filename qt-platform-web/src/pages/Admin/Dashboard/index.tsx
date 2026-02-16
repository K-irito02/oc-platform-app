import { useState, useEffect } from 'react';
import { Row, Col, Statistic, Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import { UserOutlined, AppstoreOutlined, CommentOutlined, DownloadOutlined, RiseOutlined, CloudDownloadOutlined } from '@ant-design/icons';
import { adminApi } from '@/utils/api';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    try {
      const res: any = await adminApi.getDashboardStats();
      setStats(res.data);
    } catch { /* handled */ } finally { setLoading(false); }
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '80px 0' }}>
      <Spin size="large" />
      <div style={{ marginTop: 12, color: 'var(--ink-light)', fontFamily: 'var(--font-serif)' }}>{t('common.loading')}</div>
    </div>
  );

  const statCards = [
    { title: t('admin.totalUsers'), value: stats?.totalUsers || 0, icon: <UserOutlined />, color: 'var(--indigo)' },
    { title: t('admin.totalProducts'), value: stats?.totalProducts || 0, icon: <AppstoreOutlined />, color: 'var(--celadon)' },
    { title: t('admin.totalDownloads'), value: stats?.totalDownloads || 0, icon: <DownloadOutlined />, color: 'var(--gamboge)' },
    { title: t('admin.totalComments'), value: stats?.totalComments || 0, icon: <CommentOutlined />, color: 'var(--cinnabar)' },
    { title: t('admin.newUsersToday'), value: stats?.newUsersToday || 0, icon: <RiseOutlined />, color: 'var(--indigo)' },
    { title: t('admin.downloadsToday'), value: stats?.downloadsToday || 0, icon: <CloudDownloadOutlined />, color: 'var(--celadon)' },
  ];

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--ink-darkest)', marginBottom: 4 }}>
          {t('admin.dashboard')}
        </h2>
        <p style={{ color: 'var(--ink-light)', fontSize: 13, margin: 0 }}>{t('admin.overviewDesc')}</p>
      </div>

      <Row gutter={[16, 16]}>
        {statCards.map((card, i) => (
          <Col xs={24} sm={12} lg={8} key={i}>
            <div className="paper-card" style={{
              padding: '20px 24px',
              display: 'flex', alignItems: 'center', gap: 16,
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'default',
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: `color-mix(in srgb, ${card.color} 12%, transparent)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, color: card.color,
              }}>
                {card.icon}
              </div>
              <Statistic title={<span style={{ color: 'var(--ink-light)', fontSize: 13 }}>{card.title}</span>} value={card.value} />
            </div>
          </Col>
        ))}
      </Row>

      {stats?.downloadTrend && (
        <div className="paper-card" style={{ padding: '24px', marginTop: 20, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)' }}>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--ink-darkest)', marginBottom: 16 }}>
            {t('admin.downloadTrend')}
          </h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120, padding: '0 4px' }}>
            {stats.downloadTrend.map((d: any, i: number) => {
              const max = Math.max(...stats.downloadTrend.map((t: any) => t.count));
              const h = max > 0 ? (d.count / max) * 100 : 0;
              return (
                <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: 'var(--ink-dark)', marginBottom: 4, fontWeight: 600 }}>{d.count}</div>
                  <div style={{
                    height: Math.max(h, 6),
                    background: 'linear-gradient(to top, var(--cinnabar, #8B0000), var(--ink-medium, #666))',
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 0.5s ease',
                    opacity: 0.85,
                  }} />
                  <div style={{ fontSize: 11, color: 'var(--ink-medium)', marginTop: 4, fontWeight: 500 }}>{d.date}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
