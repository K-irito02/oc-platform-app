import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Input, Button, Avatar, Checkbox, Spin } from 'antd';
import { message } from '@/utils/antdUtils';
import { Send, MessageSquare, ThumbsUp, MessageCircle } from 'lucide-react';
import { feedbackApi } from '@/utils/api';
import { useAppSelector } from '@/store/hooks';
import dayjs from 'dayjs';

const { TextArea } = Input;

// 回复项组件
const ReplyItem = ({ reply, isAuthenticated, handleLike, handleReply, t }: any) => {
  return (
    <div className="flex gap-3">
      <Avatar 
        src={reply.avatarUrl} 
        size={28}
        className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white shrink-0"
      >
        {reply.username?.[0] || reply.nickname?.[0] || 'U'}
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="space-y-1">
          <div className="flex items-center gap-1 flex-wrap text-sm">
            <span className="font-semibold text-slate-900 dark:text-white">
              {reply.username || reply.nickname || t('feedback.anonymous')}
            </span>
            {reply.replyToName && (
              <>
                <span className="text-slate-400">›</span>
                <span className="text-blue-500 font-medium">{reply.replyToName}</span>
              </>
            )}
          </div>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm">
            {reply.content}
          </p>
          <div className="flex items-center gap-4 pt-1">
            <span className="text-xs text-slate-400">{dayjs(reply.createdAt).format('YYYY-MM-DD')}</span>
            <button 
              onClick={() => handleLike(reply.id, reply.liked)}
              className={`flex items-center gap-1 text-xs transition-colors ${reply.liked ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'}`}
            >
              <ThumbsUp size={12} className={reply.liked ? 'fill-current' : ''} />
              <span>{reply.likeCount || 0}</span>
            </button>
            {isAuthenticated && (
              <button 
                onClick={() => handleReply(reply.id, reply.username || reply.nickname)}
                className="text-xs text-slate-400 hover:text-blue-500 transition-colors"
              >
                {t('feedback.reply')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// 留言项组件
const FeedbackItem = ({ feedback, isAuthenticated, handleLike, handleReply, t }: any) => {
  const [visibleCount, setVisibleCount] = useState(0);
  const replies = feedback.replies || [];
  const visibleReplies = replies.slice(0, visibleCount);
  const hasMoreReplies = visibleCount < replies.length;
  const remainingCount = replies.length - visibleCount;

  const handleExpand = () => {
    setVisibleCount(Math.min(visibleCount + 5, replies.length));
  };

  const handleCollapse = () => {
    setVisibleCount(0);
  };

  return (
    <div className="flex gap-3">
      <Avatar 
        src={feedback.avatarUrl} 
        size={36}
        className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white shrink-0"
      >
        {feedback.username?.[0] || feedback.nickname?.[0] || 'U'}
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-900 dark:text-white">
              {feedback.username || feedback.nickname || t('feedback.anonymous')}
            </span>
          </div>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
            {feedback.content}
          </p>
          <div className="flex items-center gap-4 pt-1">
            <span className="text-xs text-slate-400">{dayjs(feedback.createdAt).format('YYYY-MM-DD')}</span>
            <button 
              onClick={() => handleLike(feedback.id, feedback.liked)}
              className={`flex items-center gap-1 text-xs transition-colors ${feedback.liked ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'}`}
            >
              <ThumbsUp size={12} className={feedback.liked ? 'fill-current' : ''} />
              <span>{feedback.likeCount || 0}</span>
            </button>
            {isAuthenticated && (
              <button 
                onClick={() => handleReply(feedback.id, feedback.username || feedback.nickname)}
                className="text-xs text-slate-400 hover:text-blue-500 transition-colors"
              >
                {t('feedback.reply')}
              </button>
            )}
            {replies.length > 0 && visibleCount === 0 && (
              <button 
                onClick={handleExpand}
                className="text-xs text-blue-500 hover:text-blue-600"
              >
                {t('feedback.viewReplies', { count: replies.length })}
              </button>
            )}
          </div>
        </div>
        
        {replies.length > 0 && (
          <div className="mt-3 space-y-3 pl-3 border-l-2 border-slate-200 dark:border-slate-700">
            {visibleReplies.map((reply: any, index: number) => (
              <ReplyItem 
                key={reply.id || index}
                reply={reply} 
                isAuthenticated={isAuthenticated} 
                handleLike={handleLike} 
                handleReply={handleReply} 
                t={t}
              />
            ))}
            <div className="flex items-center gap-3 pt-1">
              {hasMoreReplies && (
                <button 
                  onClick={handleExpand}
                  className="text-sm text-blue-500 hover:text-blue-600 font-medium flex items-center gap-1"
                >
                  <span>↓</span>
                  {t('feedback.viewMoreReplies', { count: Math.min(remainingCount, 5) })}
                </button>
              )}
              {visibleCount > 0 && (
                <button 
                  onClick={handleCollapse}
                  className="text-sm text-slate-500 hover:text-slate-600 font-medium flex items-center gap-1"
                >
                  <span>↑</span>
                  {t('feedback.collapseReplies')}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function FeedbackSection() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [sortBy, setSortBy] = useState('time');
  const [sortOrder, setSortOrder] = useState('desc');
  const [replyingTo, setReplyingTo] = useState<{id: number, name: string} | null>(null);
  const [lastSubmitTime, setLastSubmitTime] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState({
    content: '',
    isPublic: true
  });
  
  // 1分钟评论限制常量
  const RATE_LIMIT_MS = 60 * 1000;

  useEffect(() => {
    loadFeedbacks();
  }, [sortBy, sortOrder]);

  const loadFeedbacks = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await feedbackApi.list({ page: 1, size: 20, sortBy, sortOrder });
      setFeedbacks(res.data?.records || res.data || []);
      const total = res.data?.totalWithReplies || res.data?.total || 0;
      setTotalCount(total);
    } catch (error) {
      console.error(error);
      setFeedbacks([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.content.trim()) {
      message.error(t('feedback.contentRequired'));
      return;
    }
    
    // 检查1分钟评论限制
    const now = Date.now();
    if (now - lastSubmitTime < RATE_LIMIT_MS) {
      const remainingSeconds = Math.ceil((RATE_LIMIT_MS - (now - lastSubmitTime)) / 1000);
      message.error(t('feedback.rateLimitExceeded', { seconds: remainingSeconds }));
      return;
    }
    
    setSubmitting(true);
    try {
      await feedbackApi.create({
        content: form.content,
        isPublic: form.isPublic,
        parentId: replyingTo?.id
      });
      message.success(t('feedback.success'));
      setForm({ content: '', isPublic: true });
      setReplyingTo(null);
      setLastSubmitTime(Date.now());
      loadFeedbacks(false);
    } catch (error: any) {
      console.error(error);
      const errorMsg = error?.response?.data?.message || '';
      if (errorMsg.includes('登录')) {
        message.error(t('feedback.loginRequired'));
      } else if (errorMsg.includes('频繁') || errorMsg.includes('rate')) {
        message.error(t('feedback.rateLimitExceeded', { seconds: 60 }));
      } else {
        message.error(t('feedback.submitFailed'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (feedbackId: number, liked: boolean) => {
    if (!isAuthenticated) {
      message.warning(t('feedback.loginToLike'));
      return;
    }
    try {
      if (liked) {
        await feedbackApi.unlike(feedbackId);
      } else {
        await feedbackApi.like(feedbackId);
      }
      loadFeedbacks(false);
    } catch {
      message.error(t('feedback.likeFailed'));
    }
  };

  const handleReply = (feedbackId: number, userName: string) => {
    setReplyingTo({ id: feedbackId, name: userName });
    // 不再在内容中添加 @ 符号，改用独立的回复提示
    setForm(prev => ({ ...prev, content: '' }));
    const formElement = document.querySelector('.feedback-form-card');
    formElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setForm(prev => ({ ...prev, content: '' }));
  };

  const handleSortChange = (newSortBy: string) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  // 处理滚动容器的滚轮事件
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const hasScroll = el.scrollHeight > el.clientHeight;
    const atTop = el.scrollTop === 0;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
    
    // 只有当容器有滚动空间且不在边界时，才阻止事件冒泡
    if (hasScroll && !((e.deltaY < 0 && atTop) || (e.deltaY > 0 && atBottom))) {
      e.stopPropagation();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:min-h-[500px]">
      {/* 留言表单 */}
      <div className="feedback-form-card bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
            <MessageSquare size={20} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {t('feedback.title')}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t('feedback.subtitle')}
            </p>
          </div>
        </div>

        {isAuthenticated ? (
          <div className="space-y-4 flex-1 flex flex-col">
            {replyingTo && (
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <span className="text-sm text-blue-600 dark:text-blue-400">
                  {t('feedback.replyingTo')} @{replyingTo.name}
                </span>
                <Button size="small" onClick={cancelReply}>{t('common.cancel')}</Button>
              </div>
            )}
            <TextArea 
              rows={6} 
              placeholder={t('feedback.placeholder')} 
              value={form.content}
              onChange={e => setForm({...form, content: e.target.value})}
              maxLength={500}
              showCount
              className="flex-1"
              style={{ minHeight: '150px' }}
            />
            <div className="flex items-center justify-between">
              <Checkbox 
                checked={form.isPublic}
                onChange={e => setForm({...form, isPublic: e.target.checked})}
              >
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {t('feedback.showInBoard')}
                </span>
              </Checkbox>
            </div>
            <Button 
              type="primary" 
              icon={<Send size={16} />} 
              loading={submitting}
              onClick={handleSubmit}
              block
              className="h-10 bg-blue-600"
            >
              {t('feedback.submit')}
            </Button>
          </div>
        ) : (
          <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex-1 flex flex-col items-center justify-center">
            <p className="text-slate-600 dark:text-slate-400 mb-4">{t('feedback.loginToMessage')}</p>
            <Link to="/login"><Button type="primary">{t('common.login')}</Button></Link>
          </div>
        )}
      </div>

      {/* 留言板 */}
      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-8 border border-slate-100 dark:border-slate-800 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MessageCircle size={20} className="text-blue-500" />
            {t('feedback.board')}
            {totalCount > 0 && (
              <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                ({totalCount})
              </span>
            )}
          </h3>
          {feedbacks.length > 0 && (
            <div className="flex gap-2">
              <Button 
                size="small" 
                type={sortBy === 'time' ? 'primary' : 'default'}
                onClick={() => handleSortChange('time')}
              >
                {t('feedback.sortByTime')} {sortBy === 'time' && (sortOrder === 'desc' ? '↓' : '↑')}
              </Button>
              <Button 
                size="small" 
                type={sortBy === 'likes' ? 'primary' : 'default'}
                onClick={() => handleSortChange('likes')}
              >
                {t('feedback.sortByLikes')} {sortBy === 'likes' && (sortOrder === 'desc' ? '↓' : '↑')}
              </Button>
              <Button 
                size="small" 
                type={sortBy === 'replies' ? 'primary' : 'default'}
                onClick={() => handleSortChange('replies')}
              >
                {t('feedback.sortByReplies')} {sortBy === 'replies' && (sortOrder === 'desc' ? '↓' : '↑')}
              </Button>
            </div>
          )}
        </div>
        
        <div 
          ref={scrollContainerRef}
          className="flex-1 min-h-[350px] max-h-[500px] pr-2 overscroll-contain overflow-y-auto"
          onWheel={handleWheel}
        >
          {loading && feedbacks.length === 0 ? (
            <div className="flex justify-center items-center h-full min-h-[200px]">
              <Spin />
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="text-center py-10 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex-1 flex flex-col items-center justify-center min-h-[200px]">
              <p className="text-slate-600 dark:text-slate-400 mb-4">{t('feedback.noMessages')}</p>
              {isAuthenticated ? (
                <Button type="link" className="text-blue-600 hover:text-blue-700">{t('feedback.beFirst')}</Button>
              ) : (
                <Link to="/login"><Button type="primary">{t('common.login')}</Button></Link>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {feedbacks.map((f) => (
                <div key={f.id} className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                  <FeedbackItem 
                    feedback={f} 
                    isAuthenticated={isAuthenticated} 
                    handleLike={handleLike} 
                    handleReply={handleReply} 
                    t={t} 
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
