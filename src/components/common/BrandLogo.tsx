import React from 'react';
import { Database } from 'lucide-react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  className = '',
}) => {
  const iconSize = size === 'lg' ? 24 : size === 'md' ? 18 : 16;
  const boxSize = size === 'lg' ? 'w-11 h-11' : size === 'md' ? 'w-8 h-8' : 'w-7 h-7';

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Clean Modern Database Icon (phpMyAdmin / TablePlus inspired) */}
      <div className={`${boxSize} rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0`}>
        <Database size={iconSize} strokeWidth={2.2} />
      </div>

      {/* Clean Brand Typography */}
      <div className="flex flex-col leading-tight">
        <div className="flex items-center gap-1.5">
          <span
            className={`font-bold tracking-tight text-slate-900 ${
              size === 'lg' ? 'text-xl' : size === 'md' ? 'text-sm' : 'text-xs'
            }`}
          >
            Washeng
          </span>
          <span
            className={`font-semibold tracking-tight text-blue-600 ${
              size === 'lg' ? 'text-xl' : size === 'md' ? 'text-sm' : 'text-xs'
            }`}
          >
            DB Studio
          </span>
          <span className="hidden sm:inline-block text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
            MySQL
          </span>
        </div>
        {showSubtitle && (
          <span className="text-[11px] text-slate-500 font-sans mt-0.5">
            Database Management & Ops
          </span>
        )}
      </div>
    </div>
  );
};
