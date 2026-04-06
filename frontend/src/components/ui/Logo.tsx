interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { icon: 20, text: 'text-sm' },
  md: { icon: 24, text: 'text-base' },
  lg: { icon: 32, text: 'text-lg' },
  xl: { icon: 40, text: 'text-xl' },
};

export function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const s = sizeMap[size];
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {showText && (
        <span className={`${s.text} font-bold tracking-tight text-on-surface whitespace-nowrap`}>
          <span className="font-['Noto_Serif'] italic font-black tracking-tighter">Manuscript AI</span>
        </span>
      )}
    </div>
  );
}
