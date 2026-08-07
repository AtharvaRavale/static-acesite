import { useCallback, useState } from "react";
import { Link } from "react-router-dom";

const TAGLINE = "Construction operations, unified on one platform.";

export function LoginBrandPanel() {
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLElement>) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    setOffset({ x: x * 14, y: y * 10 });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setOffset({ x: 0, y: 0 });
  }, []);

  return (
    <aside
      className="login-brand-panel relative hidden lg:flex lg:w-[min(46%,520px)] lg:min-h-screen flex-col justify-between overflow-hidden p-10 xl:p-12"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Premium partition line */}
      <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-border to-transparent z-50">
        <div className="absolute left-1/2 top-1/2 h-[30%] w-[2px] -translate-x-1/2 -translate-y-1/2 bg-gradient-to-b from-transparent via-primary/50 to-transparent blur-[2px]" />
        <div className="absolute left-1/2 top-1/2 h-[15%] w-px -translate-x-1/2 -translate-y-1/2 bg-gradient-to-b from-transparent via-primary to-transparent" />
      </div>

      <div
        aria-hidden
        className="login-brand-grid absolute inset-0 opacity-40 transition-transform duration-500 ease-out"
        style={{
          transform: `translate(${-offset.x * 0.4}px, ${-offset.y * 0.4}px)`,
        }}
      />
      <div
        aria-hidden
        className="login-brand-glow absolute left-1/2 top-1/3 h-[min(80vw,28rem)] w-[min(80vw,28rem)] -translate-x-1/2 rounded-full opacity-80 transition-transform duration-500 ease-out"
        style={{
          transform: `translate(calc(-50% + ${offset.x * 0.6}px), ${offset.y * 0.5}px)`,
        }}
      />

      <div className="relative z-10">
        <Link to="/" className="inline-flex items-center gap-3">
          <div className="login-logo-glow flex text-primary">
            <svg width="34" height="34" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 2L2 28H10L16 16L22 28H30L16 2Z" fill="currentColor"/>
              <path d="M16 19L20.5 28H11.5L16 19Z" fill="currentColor" opacity="0.4"/>
            </svg>
          </div>
          <span className="font-logo text-2xl tracking-tight text-foreground leading-none mt-1">
            Ace<span className="opacity-60 font-semibold">Site</span>
          </span>
        </Link>
      </div>

      <div className="relative z-10 max-w-sm">
        <h1 className="font-display text-[3rem] xl:text-[3.8rem] leading-[1.02] font-extrabold tracking-[-0.02em] text-foreground">
          Welcome
          <br />
          back<span className="login-primary-dot text-primary">.</span>
        </h1>
        <p className="login-intro-delay mt-4 text-[15px] leading-[1.7] text-muted-foreground">
          {TAGLINE}
        </p>

        <div className="login-intro-late mt-16 sm:mt-20 flex flex-col gap-10">
          <div className="flex flex-col gap-2.5">
            <span className="font-display text-[2.5rem] font-light tracking-tight text-foreground leading-none">
              $12B+
            </span>
            <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-muted-foreground">
              Active Portfolio Value
            </span>
          </div>

          <div className="w-10 h-px bg-primary/30" />

          <div className="flex flex-col gap-2.5">
            <span className="font-display text-[2.5rem] font-light tracking-tight text-foreground leading-none">
              100k
            </span>
            <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-muted-foreground">
              Daily Field Reports
            </span>
          </div>
        </div>
      </div>

      <p className="relative z-10 text-sm text-muted-foreground font-medium">
        Secure access for your team
      </p>
    </aside>
  );
}
