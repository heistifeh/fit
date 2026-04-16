import { ReactNode, ButtonHTMLAttributes } from 'react';

type CustomButtonProps = {
  title: string;
  rightIcon?: ReactNode;
  variant?: 'primary' | 'outline' | 'link';
  color?: string;
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export default function CustomButton({
  title,
  rightIcon,
  variant = 'primary',
  color,
  className = '',
  ...buttonProps
}: CustomButtonProps) {
  const baseClasses = 'relative flex items-center justify-center w-full min-h-[52px] py-4 font-semibold text-base tracking-wide rounded-xl transition-opacity hover:opacity-90 active:scale-[0.98] active:opacity-90 disabled:opacity-50';

  const variantClasses = {
    primary: color
      ? `text-white`
      : 'bg-tint dark:bg-tint-dark text-white dark:text-gray-900',
    outline: color
      ? `border-2 bg-transparent`
      : 'border-2 border-tint dark:border-tint-dark text-tint dark:text-tint-dark bg-transparent',
    link: color
      ? `bg-transparent`
      : 'bg-transparent text-tint dark:text-tint-dark',
  };

  const inlineStyle = color
    ? {
        ...(variant === 'primary' && { backgroundColor: color }),
        ...(variant === 'outline' && { borderColor: color, color }),
        ...(variant === 'link' && { color }),
      }
    : undefined;

  return (
    <button
      {...buttonProps}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={inlineStyle}
    >
      {title}
      {rightIcon && (
        <span className="absolute right-5">{rightIcon}</span>
      )}
    </button>
  );
}
