import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const VaultyCursor: React.FC = () => {
  const [coords, setCoords] = React.useState({ x: 0, y: 0 });
  const [visible, setVisible] = React.useState(false);
  const [comment, setComment] = React.useState<string | null>(null);
  const [displayedText, setDisplayedText] = React.useState('');
  const [isTouchDevice, setIsTouchDevice] = React.useState(false);
  
  const { isAuthenticated, userId, userEmail } = useAuth();
  const [profileName, setProfileName] = React.useState<string>('');
  const [hasVaults, setHasVaults] = React.useState<boolean>(true);
  const [showWelcome, setShowWelcome] = React.useState(false);
  const [tutorialCompleteMsg, setTutorialCompleteMsg] = React.useState(false);
  const location = useLocation();

  // Mouse tracker & inactivity auto-hide
  React.useEffect(() => {
    let inactivityTimer: NodeJS.Timeout;

    const checkTouch = () => {
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    checkTouch();

    const handleMouseMove = (e: MouseEvent) => {
      setCoords({ x: e.clientX, y: e.clientY });
      setVisible(true);

      // Reset inactivity timer
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        setVisible(false);
      }, 4000); // Fade out after 4 seconds of stillness
    };

    const handleMouseLeave = () => {
      setVisible(false);
      clearTimeout(inactivityTimer);
    };

    const handleMouseEnter = () => {
      setVisible(true);
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      clearTimeout(inactivityTimer);
    };
  }, []);

  // Fetch profile name & vaults state on login
  React.useEffect(() => {
    if (isAuthenticated && userId) {
      const fetchUserData = async () => {
        try {
          const headers = { 'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJncm91cCI6ImFub24iLCJpYXQiOjE3ODA1MDQ3NDF9.mazeway_db_anon_bW2ZZjt2Sjo1wgXjztKaHNtQ3qDweIkMBLdxkXt2JfHUoJ6SNuDXI94uilesnFoC' };
          
          // Fetch profile name
          const profRes = await fetch(`https://mazeway-db.onrender.com/api/v1/tables/profiles/rows`, { headers });
          const profiles = profRes.ok ? await profRes.json() : [];
          const profile = profiles.find((p: any) => p.id === userId);
          const name = profile?.full_name || userEmail?.split('@')[0] || 'User';
          setProfileName(name);

          // Fetch vaults to check if user has created any yet
          const vaultsRes = await fetch(`https://mazeway-db.onrender.com/api/v1/tables/vaults/rows`, { headers });
          const vaults = vaultsRes.ok ? await vaultsRes.json() : [];
          const userVaults = vaults.filter((v: any) => v.user_id === userId);
          
          const currentHasVaults = userVaults.length > 0;
          setHasVaults(currentHasVaults);

          // If they just created their first vault, complete the tutorial
          if (currentHasVaults && !localStorage.getItem('vaulty_tutorial_seen')) {
            localStorage.setItem('vaulty_tutorial_seen', 'true');
            setTutorialCompleteMsg(true);
            setTimeout(() => setTutorialCompleteMsg(false), 6000);
          }
        } catch (e) {
          console.error('[Vaulty] Failed to fetch sync details:', e);
          setProfileName(userEmail?.split('@')[0] || 'User');
        }
      };
      fetchUserData();
    } else {
      setProfileName('');
      setHasVaults(true);
    }
  }, [isAuthenticated, userId, userEmail]);

  // Show re-login welcome greeting
  React.useEffect(() => {
    if (isAuthenticated && profileName) {
      setShowWelcome(true);
      const timer = setTimeout(() => setShowWelcome(false), 6000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, profileName]);

  // Typewriter writing animation
  React.useEffect(() => {
    if (!comment) {
      setDisplayedText('');
      return;
    }
    
    let currentLength = 0;
    setDisplayedText('');
    
    const timer = setInterval(() => {
      currentLength++;
      setDisplayedText(comment.substring(0, currentLength));
      if (currentLength >= comment.length) {
        clearInterval(timer);
      }
    }, 25);
    
    return () => clearInterval(timer);
  }, [comment]);

  // Hover states & dialogue scheduler
  React.useEffect(() => {
    const handleMouseOver = (e: MouseEvent) => {
      if (showWelcome && profileName) {
        setComment(`WELCOME BACK, ${profileName.toUpperCase()}! LET'S SHARE SECURE PAYLOADS TODAY! 🤖💥`);
        return;
      }
      if (tutorialCompleteMsg) {
        setComment(`TUTORIAL COMPLETE! YOU ARE NOW A QR VAULT MASTER! 👑🔮`);
        return;
      }

      const target = e.target as HTMLElement;
      if (!target) return;

      const button = target.closest('button');
      const link = target.closest('a');
      const input = target.closest('input');
      const select = target.closest('select');

      const text = (target.textContent || '').trim();
      const btnText = button ? (button.textContent || '').trim() : '';
      const linkText = link ? (link.textContent || '').trim() : '';

      // Onboarding Tutorial steps
      const tutorialSeen = localStorage.getItem('vaulty_tutorial_seen') === 'true';
      if (!tutorialSeen) {
        if (!isAuthenticated) {
          if (location.pathname === '/login') {
            setComment("TUTORIAL: STEP 2 - FILL IN YOUR EMAIL & AUTH CODE TO ENERGIZE MY SECURE STORAGE CORE! 🗝️🤖");
            return;
          } else {
            setComment("TUTORIAL: STEP 1 - CLICK 'SIGN IN' AT THE TOP TO INITIATE CO-PILOT SYSTEM! 🚀👉");
            return;
          }
        } else if (!hasVaults) {
          setComment("TUTORIAL: STEP 3 - CLICK 'CREATE VAULT' ON THE DASHBOARD TO GENERATE YOUR FIRST SECURE QR PORTAL! 📂✨");
          return;
        }
      }

      // Guest prompts
      if (!isAuthenticated) {
        if (location.pathname === '/pricing') {
          setComment("HMM... YOU NEED THOSE PLAN UPGRADES. SIGN IN TO ACTIVATE 1GB VAULT SPACE! ⚡🤖");
          return;
        }
        if (location.pathname === '/login') {
          setComment("ENTER SECURE CODES FOR ACCESS SHELF ACTIVATION! 🗝️✨");
          return;
        }
        if (button || link) {
          setComment("STOP! ACTIVATE 1GB SECURE FILE SHIELD BY REGISTERING! 🚀🛡️");
          return;
        }
        setComment("HELLO HUMAN! LOG IN TO SECURE 1GB VAULT STORAGE SYSTEM FOR FREE! 👾");
        return;
      }

      // 1. Vault creation
      if (
        btnText.toLowerCase().includes('create vault') || 
        text.toLowerCase().includes('create vault') ||
        btnText.toLowerCase().includes('create new vault') ||
        text.toLowerCase().includes('create new vault') ||
        (link && link.href.includes('create'))
      ) {
        setComment("HMM... CREATING NEW VAULT. DAMM EASY FOR SHARING PURPOSE! 📂🤖");
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
        setComment("OH LET'S TAKE SOME DATA! SECURE DROP-BOX INITIATED 😏📂");
        return;
      }

      // 3. Pricing page hovering
      if (location.pathname === '/pricing') {
        const pricingCard = target.closest('.group');
        if (pricingCard) {
          const planName = pricingCard.querySelector('h3')?.textContent || '';
          if (planName.toLowerCase().includes('pro') || planName.toLowerCase().includes('plus') || planName.toLowerCase().includes('starter')) {
            setComment("YESS MAKE IT QUICK INCREASE MY POWERS IM EXCITED! ⚡🔋");
          } else {
            setComment("HMM VERY NICE YOU NEED THIS PROTOCOL SHIELD! 🛡️");
          }
          return;
        }
      }

      // 4. Hovering other interactive elements
      if (button || link || input || select) {
        if (btnText.toLowerCase().includes('cancel')) {
          setComment("WAIT, CANCELLATION? DON'T TERMINATE ME! 🥺💔");
        } else if (btnText.toLowerCase().includes('save') || btnText.toLowerCase().includes('update')) {
          setComment("LOCKING IT DOWN INTO THE ENCRYPTED FILE MATRIX! 🔒⚡");
        } else if (linkText.toLowerCase().includes('pricing') || linkText.toLowerCase().includes('plus') || linkText.toLowerCase().includes('pro')) {
          setComment("UPGRADE DETECTED! INITIATING HIGHER LIFE SUPPORT SPEED! 🚀🔋");
        } else if (btnText.toLowerCase().includes('sign in') || btnText.toLowerCase().includes('login') || btnText.toLowerCase().includes('signup')) {
          setComment("WELCOME TO THE RETRO VAULTGATE ARCHIVE ENTRANCE! 🗝️💥");
        } else {
          setComment("SYSTEM READY FOR TRANSMISSION! 🚀");
        }
        return;
      }

      // Default page comments
      if (location.pathname === '/pricing') {
        setComment("YESS MAKE IT QUICK INCREASE MY POWERS IM EXCITED! ⚡");
      } else if (location.pathname === '/blogs') {
        setComment("LET'S AUDIT SOME TECH DIARIES! 📚🤖");
      } else if (location.pathname === '/api') {
        setComment("API CORE ONLINE. INITIATING INTEGRATION PROTOCOLS! 💻🤖");
      } else if (location.pathname === '/changelog') {
        setComment("AUDITING SYSTEMS CHANGELOG LOGBOOKS! 🛠️🚀");
      } else if (location.pathname === '/dashboard') {
        setComment(`WELCOME BACK, ${profileName.toUpperCase()}! READY TO BEACON SOME CODE? 📂🛡️`);
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
  }, [location.pathname, showWelcome, profileName, hasVaults, tutorialCompleteMsg, isAuthenticated]);

  if (isTouchDevice) return null;

  return (
    <div 
      className={`fixed top-0 left-0 pointer-events-none z-[9999] flex items-center gap-3 select-none transition-all duration-300 ${
        visible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
      }`}
      style={{
        transform: `translate3d(${coords.x + 15}px, ${coords.y + 15}px, 0)`,
        // We use transition-all for opacity/scale changes, but translate uses transform speed for responsiveness
        transitionProperty: 'opacity, scale',
      }}
    >
      {/* Pixel Art Badge with Text Vaulty (No emoji, no circle) */}
      <div className="bg-[#7c3aed] border-4 border-black px-3.5 py-1.5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center relative select-none">
        {/* Inner scanline overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/15 to-transparent pointer-events-none bg-[length:100%_4px]" />
        <span className="text-xs font-mono font-black text-white uppercase tracking-widest select-none animate-pulse">
          Vaulty
        </span>
      </div>

      {/* Pixel Art Speech bubble with Typewriter animation and blinking block cursor */}
      <div 
        className={`bg-[#120024]/95 text-[#a78bfa] font-mono border-4 border-black p-3.5 text-xs font-bold max-w-[265px] leading-relaxed shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 transform origin-left backdrop-blur-sm ${
          comment 
            ? 'scale-100 opacity-100 translate-x-0' 
            : 'scale-75 opacity-0 -translate-x-2 pointer-events-none'
        }`}
      >
        <span className="uppercase tracking-wide after:content-['█'] after:animate-pulse after:text-yellow-400 after:ml-0.5">
          {displayedText}
        </span>
      </div>
    </div>
  );
};
