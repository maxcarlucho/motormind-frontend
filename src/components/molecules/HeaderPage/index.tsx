import { useNavigate } from 'react-router-dom';
import { Button } from '../../atoms/Button';
import { ArrowLeftIcon } from 'lucide-react';

interface HeaderPageProps {
  data: {
    title: string;
    description?: string;
  };
  onBack?: () => void;
  label?: string;
  headerActions?: React.ReactNode;
}

export default function HeaderPage({ data, onBack, label = '', headerActions }: HeaderPageProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) onBack();
    else navigate('/');
  };

  return (
    <div className="sticky top-0 z-10 flex items-center justify-between bg-white px-4 py-2 shadow-sm sm:py-4">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="flex shrink-0 items-center gap-2 pl-0"
        >
          <ArrowLeftIcon className="text-muted !h-4 !w-4 sm:!h-5 sm:!w-5" />
          {label && label}
        </Button>

        <div className="min-w-0 flex-1">
          <h1 className="text-md truncate font-semibold sm:text-xl">{data.title}</h1>
          <p className="text-muted truncate text-xs sm:text-sm">{data.description}</p>
        </div>
      </div>
      {/* Header actions */}
      <div>{headerActions}</div>
    </div>
  );
}
