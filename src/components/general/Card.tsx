import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

type CardProps = {
  title: string;
  children: ReactNode;
  href?: string;
  className?: string;
};

export default function Card({ title, children, href, className = '' }: CardProps) {
  const content = (
    <div className={`p-4 border-l-2 border-tint dark:border-tint-dark bg-gray-50 dark:bg-zinc-900 rounded-r-lg shadow-sm ${className}`}>
      <p className="text-[17px] font-bold mb-2">{title}</p>
      {children}
    </div>
  );

  if (href) {
    return (
      <Link to={href} className="block active:opacity-70 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}
