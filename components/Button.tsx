import React from 'react';

export type ButtonVariant = 'primary' | 'success' | 'danger' | 'warning' | 'neutral';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  isLoading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  icon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'font-bold rounded-lg transition-all duration-200 shadow-sm active:scale-95 disabled:active:scale-100 disabled:shadow-none select-none flex items-center justify-center';

  const sizeStyles: Record<ButtonSize, string> = {
    xs: 'py-1 px-2.5 text-xs rounded-md',
    sm: 'py-1.5 px-3.5 text-xs rounded-md',
    md: 'py-2 px-5 text-sm rounded-md',
    lg: 'py-2.5 px-7 text-base rounded-lg',
    xl: 'py-3 px-10 text-lg rounded-xl',
  };

  const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white border border-transparent',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white border border-transparent',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white border border-transparent',
    warning: 'bg-amber-500 hover:bg-amber-600 text-white border border-transparent',
    neutral: 'bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200 border border-slate-300 dark:border-slate-600',
  };

  const disabledStyles = 'disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed disabled:opacity-50 dark:disabled:bg-slate-800 dark:disabled:text-slate-600';

  const loadingStyles = isLoading ? 'cursor-wait opacity-70' : '';

  const widthStyles = fullWidth ? 'w-full' : '';

  const combinedStyles = `
    ${baseStyles}
    ${sizeStyles[size]}
    ${variantStyles[variant]}
    ${disabledStyles}
    ${loadingStyles}
    ${widthStyles}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <button
      className={combinedStyles}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-0V4a8 8 0 00-16 0v4zM4 12a8 8 0 018 0v4a8 8 0 00-16 0v4z" />
          </svg>
          <span>Cargando...</span>
        </span>
      ) : (
        <span className="flex items-center justify-center gap-2">
          {icon}
          {children}
        </span>
      )}
    </button>
  );
};

export default Button;
