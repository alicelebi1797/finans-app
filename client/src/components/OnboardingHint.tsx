import { useState, useEffect, useRef } from 'react';
import { X, Info } from 'lucide-react';

interface Props {
  stepId: string;
  userId: number | undefined;
  title: string;
  text: string;
  watchRef: React.RefObject<HTMLElement | null>;
}

export function OnboardingHint({ stepId, userId, title, text, watchRef }: Props) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState<boolean | null>(null);

  useEffect(() => {
    if (!userId) return;
    const key = `onb_v1_${userId}`;
    try {
      const done: string[] = JSON.parse(localStorage.getItem(key) || '[]');
      if (done.includes(stepId)) { setDismissed(true); return; }
    } catch {}
    setDismissed(false);

    const el = watchRef?.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [userId, stepId]);

  const dismiss = () => {
    setDismissed(true);
    setVisible(false);
    if (!userId) return;
    const key = `onb_v1_${userId}`;
    try {
      const done: string[] = JSON.parse(localStorage.getItem(key) || '[]');
      localStorage.setItem(key, JSON.stringify([...new Set([...done, stepId])]));
    } catch {}
  };

  if (dismissed !== false || !visible) return null;

  return (
    <div
      data-testid={`onboarding-hint-${stepId}`}
      className="mt-2 rounded-xl border border-primary/25 bg-primary/5 dark:bg-primary/10 px-4 py-3 flex items-start gap-3 animate-in slide-in-from-top-2 duration-300"
    >
      <Info size={15} className="text-primary flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-primary mb-0.5">{title}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{text}</p>
      </div>
      <button
        data-testid={`button-dismiss-${stepId}`}
        onClick={dismiss}
        className="flex-shrink-0 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
      >
        <X size={13} />
      </button>
    </div>
  );
}
