import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * 倒计时 Hook
 * 用于管理验证码发送后的倒计时逻辑，自动清理定时器防止内存泄漏
 * 
 * @param initialCount - 初始倒计时秒数，默认 60
 * @returns { countdown, start, reset, isCounting } - 倒计时状态和控制方法
 * 
 * @example
 * const { countdown, start, isCounting } = useCountdown(60);
 * 
 * // 发送验证码时
 * const handleSendCode = async () => {
 *   await sendCode();
 *   start(); // 开始倒计时
 * };
 * 
 * // 在按钮上显示
 * <Button disabled={isCounting}>
 *   {countdown > 0 ? `${countdown}s` : '发送验证码'}
 * </Button>
 */
export function useCountdown(initialCount: number = 60) {
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 清理定时器
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // 开始倒计时
  const start = useCallback(() => {
    // 先清理可能存在的旧定时器
    clearTimer();
    
    setCountdown(initialCount);
    
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearTimer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [initialCount, clearTimer]);

  // 重置倒计时
  const reset = useCallback(() => {
    clearTimer();
    setCountdown(0);
  }, [clearTimer]);

  // 是否正在倒计时
  const isCounting = countdown > 0;

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  return {
    countdown,
    start,
    reset,
    isCounting,
  };
}

export default useCountdown;
