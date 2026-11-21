import React, { useState, useEffect } from 'react';

export const CountdownTimer = ({ endTime, onEnd, isCompact = false }) => {
  const [timeLeft, setTimeLeft] = useState(() => calculateRemaining(endTime));

  function calculateRemaining(target) {
    const total = Math.max(0, new Date(target).getTime() - Date.now());
    const seconds = Math.floor((total / 1000) % 60);
    const minutes = Math.floor((total / 1000 / 60) % 60);
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    const days = Math.floor(total / (1000 * 60 * 60 * 24));

    return { total, days, hours, minutes, seconds };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = calculateRemaining(endTime);
      setTimeLeft(remaining);

      if (remaining.total <= 0) {
        clearInterval(timer);
        if (onEnd) onEnd();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime, onEnd]);

  if (timeLeft.total <= 0) {
    return (
      <span className="badge badge-ended">
        Auction Concluded
      </span>
    );
  }

  const isUrgent = timeLeft.total < 1000 * 60 * 60; // < 1 hour
  const isCritical = timeLeft.total < 1000 * 60 * 5; // < 5 mins

  if (isCompact) {
    return (
      <span className={`timer-compact ${isCritical ? 'urgent-critical' : isUrgent ? 'urgent' : ''}`}>
        ⏱️ {timeLeft.days > 0 ? `${timeLeft.days}d ` : ''}
        {String(timeLeft.hours).padStart(2, '0')}:
        {String(timeLeft.minutes).padStart(2, '0')}:
        {String(timeLeft.seconds).padStart(2, '0')}
      </span>
    );
  }

  return (
    <div className={`countdown-clock ${isCritical ? 'urgent-critical' : isUrgent ? 'urgent' : ''}`}>
      {timeLeft.days > 0 && (
        <div className="clock-segment">
          <span className="clock-num">{timeLeft.days}</span>
          <span className="clock-unit">days</span>
        </div>
      )}
      <div className="clock-segment">
        <span className="clock-num">{String(timeLeft.hours).padStart(2, '0')}</span>
        <span className="clock-unit">hrs</span>
      </div>
      <div className="clock-separator">:</div>
      <div className="clock-segment">
        <span className="clock-num">{String(timeLeft.minutes).padStart(2, '0')}</span>
        <span className="clock-unit">min</span>
      </div>
      <div className="clock-separator">:</div>
      <div className="clock-segment">
        <span className="clock-num">{String(timeLeft.seconds).padStart(2, '0')}</span>
        <span className="clock-unit">sec</span>
      </div>
    </div>
  );
};
