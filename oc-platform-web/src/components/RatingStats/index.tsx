import { Rate, Progress } from 'antd';
import { Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type RatingStatsProps = {
  type?: 'product' | 'experience';
  averageRating: number;
  totalRatings: number;
  distribution: Record<number, number>;
  userRating?: number | null;
  onRate?: (rating: number) => void;
  isAuthenticated?: boolean;
  showInput?: boolean;
};

export default function RatingStats({
  type = 'product',
  averageRating,
  totalRatings,
  distribution,
  userRating,
  onRate,
  isAuthenticated = false,
  showInput = true,
}: RatingStatsProps) {
  const { t } = useTranslation();

  const prefix = type === 'product' ? 'rating' : 'experienceRating';

  const getPercentage = (count: number) => {
    if (totalRatings === 0) return 0;
    return Math.round((count / totalRatings) * 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-6">
        <div className="text-center min-w-[100px]">
          <div className="text-4xl font-bold text-slate-900 dark:text-white">
            {averageRating.toFixed(1)}
          </div>
          <div className="flex justify-center mt-1">
            <Rate disabled allowHalf value={averageRating} className="text-sm" />
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t(`${prefix}.ratings`, { count: totalRatings })}
          </div>
        </div>

        <div className="flex-1 space-y-2">
          {[5, 4, 3, 2, 1].map((star) => (
            <div key={star} className="flex items-center gap-2">
              <span className="text-sm text-slate-600 dark:text-slate-400 w-8">
                {star} {t(`${prefix}.stars`, { count: star }).split(' ')[1] || '星'}
              </span>
              <Progress
                percent={getPercentage(distribution[star] || 0)}
                showInfo={false}
                strokeColor="#fbbf24"
                trailColor="rgba(251, 191, 36, 0.2)"
                size="small"
                className="flex-1"
              />
              <span className="text-sm text-slate-500 dark:text-slate-400 w-8 text-right">
                {distribution[star] || 0}
              </span>
            </div>
          ))}
        </div>
      </div>

      {showInput && (
        <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {userRating ? t(`${prefix}.myRating`) : t(`${prefix}.submitRating`)}:
              </span>
              <Rate
                value={userRating || 0}
                onChange={onRate}
                className="text-lg"
              />
              {userRating && (
                <span className="text-sm text-amber-500 font-medium">
                  {userRating} {t(`${prefix}.stars`, { count: userRating }).split(' ')[1] || '星'}
                </span>
              )}
            </div>
          ) : (
            <div className="text-center text-sm text-slate-500 dark:text-slate-400">
              <Star size={14} className="inline mr-1 text-amber-400" />
              {t(`${prefix}.loginToRate`)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
