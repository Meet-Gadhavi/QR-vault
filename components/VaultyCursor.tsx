import React from 'react';
import { useLocation } from 'react-router-dom';

export const VaultyCursor: React.FC = () => {
  const [coords, setCoords] = React.useState({ x: 0, y: 0 });
  const [visible, setVisible] = React.useState(false);
  const [comment, setComment] = React.useState<string | null>(null);
  const [isTouchDevice, setIsTouchDevice] = React.useState(false);
  const location = useLocation();

  React.useEffect(() => {
    const checkTouch = () => {
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    checkTouch();

    const handleMouseMove = (e: MouseEvent) => {
      setCoords({ x: e.clientX, y: e.clientY });
      if (!visible) setVisible(true);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [visible]);

  React.useEffect(() => {
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      const button = target.closest('button');
      const link = target.closest('a');
      const input = target.closest('input');
      const select = target.closest('select');

      const text = (target.textContent || '').trim();
      const btnText = button ? (button.textContent || '').trim() : '';
      const linkText = link ? (link.textContent || '').trim() : '';

      // 1. Vault creation
      if (
        btnText.toLowerCase().includes('create vault') || 
        text.toLowerCase().includes('create vault') ||
        btnText.toLowerCase().includes('create new vault') ||
        text.toLowerCase().includes('create new vault') ||
        (link && link.href.includes('create'))
      ) {
        setComment("hmm creating new vault damm easy for sharing purpose ..");
        return;
      }

      // 2. Collection Mode inside popup (Create Vault)
      if (
        text.toLowerCase().includes('receiving') || 
        text.toLowerCase().includes('collection') ||
        text.toLowerCase().includes('incoming') ||
        btnText.toLowerCase().includes('receiving') ||
        btnText.toLowerCase().includes('collection') ||
        (target.closest('[role="switch"]') || target.closest('input[type="checkbox"]')) && 
        (target.closest('div')?.textContent || '').toLowerCase().includes('receiving')
      ) {
        setComment("oh let's take some data 😏📂");
        return;
      }

      // 3. Pricing page hovering
      if (location.pathname === '/pricing') {
        const pricingCard = target.closest('.group');
        if (pricingCard) {
          const planName = pricingCard.querySelector('h3')?.textContent || '';
          if (planName.toLowerCase().includes('pro') || planName.toLowerCase().includes('plus') || planName.toLowerCase().includes('starter')) {
            setComment("yess make it quick increase my powers im excited! ⚡🔋");
          } else {
            setComment("hmm very nice you need this! 🛡️");
          }
          return;
        }
      }

      // 4. Hovering other interactive elements
      if (button || link || input || select) {
        if (btnText.toLowerCase().includes('cancel')) {
          setComment("Wait, cancellation? Don't leave me! 🥺💔");
        } else if (btnText.toLowerCase().includes('save') || btnText.toLowerCase().includes('update')) {
          setComment("Locking it down! 🔒✨");
        } else if (linkText.toLowerCase().includes('pricing') || linkText.toLowerCase().includes('plus') || linkText.toLowerCase().includes('pro')) {
          setComment("Upgrade time! Let's level up! ⚡🔋");
        } else if (btnText.toLowerCase().includes('sign in') || btnText.toLowerCase().includes('login') || btnText.toLowerCase().includes('signup')) {
          setComment("Welcome to the secret vault entrance! 🗝️✨");
        } else {
          setComment("Let's do this! 🚀");
        }
        return;
      }

      // Default page comments
      if (location.pathname === '/pricing') {
        setComment("yess make it quick increase my powers im excited! ⚡");
      } else if (location.pathname === '/blogs') {
        setComment("let's read some tech secrets! 📚🤖");
      } else if (location.pathname === '/api') {
        setComment("Let's build something epic! 💻🤖");
      } else if (location.pathname === '/changelog') {
        setComment("Look at all these upgrades! 🛠️🚀");
      } else if (location.pathname === '/dashboard') {
        setComment("Welcome back! What are we sharing today? 📂🛡️");
      } else {
        setComment(null);
      }
    };

    const handleMouseLeave = () => {
      setComment(null);
    };

    window.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      window.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [location.pathname]);

  if (isTouchDevice || !visible) return null;

  return (
    <div 
      className="fixed top-0 left-0 pointer-events-none z-[9999] flex items-center gap-3 transition-transform duration-[0.08s] ease-out select-none"
      style={{
        transform: `translate3d(${coords.x + 15}px, ${coords.y + 15}px, 0)`,
      }}
    >
      {/* Vaulty Badge */}
      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary-600 to-indigo-500 border border-white/20 shadow-[0_0_15px_rgba(124,58,237,0.5)] flex items-center justify-center relative overflow-hidden animate-pulse">
        {/* Glow inner circle */}
        <div className="absolute inset-0.5 rounded-full bg-[#0a0a0a]/90 flex items-center justify-center">
          <span className="text-base">🤖</span>
        </div>
      </div>

      {/* Speech bubble */}
      <div 
        className={`bg-slate-950/95 dark:bg-black/90 text-white rounded-[1.25rem] px-4 py-2.5 text-xs font-bold shadow-2xl border border-white/10 max-w-[240px] leading-relaxed transition-all duration-300 transform origin-left backdrop-blur-sm ${
          comment 
            ? 'scale-100 opacity-100 translate-x-0' 
            : 'scale-75 opacity-0 -translate-x-2 pointer-events-none'
        }`}
      >
        <div className="text-[10px] text-primary-400 font-extrabold uppercase tracking-wider mb-0.5">Vaulty</div>
        <div>{comment}</div>
      </div>
    </div>
  );
};
