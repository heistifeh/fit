import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

type PageHeaderProps = {
  title: string;
  showBack?: boolean;
  rightAction?: ReactNode;
};

export default function PageHeader({ title, showBack, rightAction }: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="sticky top-0 z-20 bg-white/95 dark:bg-[#f8f9fa]/95 backdrop-blur-sm px-4 flex items-center justify-between py-3 mb-4 -mx-4">
      <div className="flex items-center gap-0.5">
        {showBack && (
          <button
            onClick={() => navigate(-1)}
            className="p-3 -ml-3 text-gray-500 dark:text-gray-400 active:text-gray-900 dark:active:text-white"
          >
            <ChevronLeft size={22} />
          </button>
        )}
        <h1 className="text-xl font-bold">{title}</h1>
      </div>
      {rightAction}
    </div>
  );
}
