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
  const baseStyles = 'font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:shadow-none';

  const sizeStyles: Record<ButtonSize, string> = {
    xs: 'py-1 px-2 text-xs font-bold rounded-md',
    sm: 'py-1.5 px-3 text-xs font-bold rounded-md',
    md: 'py-2 px-4 text-sm font-bold rounded-md',
    lg: 'py-2.5 px-6 text-lg font-bold rounded-lg',
    xl: 'py-3 px-8 text-xl font-bold rounded-xl',
  };

  const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white',
    success: 'bg-success-500 hover:bg-success-600 text-white',
    danger: 'bg-danger-500 hover:bg-danger-600 text-white',
    warning: 'bg-warning-500 hover:bg-warning-600 text-white',
    neutral: 'bg-slate-200 hover:bg-slate-300 text-slate-700',
  };

  const darkVariantStyles: Record<ButtonVariant, string> = {
    primary: 'dark:bg-primary-600 dark:hover:bg-primary-500 dark:text-white',
    success: 'dark:bg-success-600 dark:hover:bg-success-500 dark:text-white',
    danger: 'dark:bg-danger-600 dark:hover:bg-danger-500 dark:text-white',
    warning: 'dark:bg-warning-600 dark:hover:bg-warning-500 dark:text-white',
    neutral: 'dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-300',
  };

  const disabledStyles = 'disabled:bg-slate-400 disabled:cursor-not-allowed disabled:opacity-50';

  const loadingStyles = isLoading ? 'cursor-waiting opacity-70' : '';

  const widthStyles = fullWidth ? 'w-full' : '';

  const combinedStyles = `
    ${baseStyles}
    ${sizeStyles[size]}
    ${variantStyles[variant]}
    ${darkVariantStyles[variant]}
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
