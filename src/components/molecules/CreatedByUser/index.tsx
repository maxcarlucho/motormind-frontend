import { Avatar, AvatarFallback, AvatarImage } from '@/components/atoms/Avatar';
import { getInitials } from '@/utils';

interface CreatedByUserProps {
  user:
    | {
        name?: string;
      }
    | string
    | null
    | undefined;
  className?: string;
}

export const CreatedByUser = ({ user, className = '' }: CreatedByUserProps) => {
  const userName = typeof user === 'object' ? user?.name : undefined;

  if (!userName) return null;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Avatar className="h-6 w-6 sm:h-9 sm:w-9">
        <AvatarImage alt={userName || 'Unknown'} />
        <AvatarFallback className="text-xs sm:text-base">
          {userName ? getInitials(userName) : 'NN'}
        </AvatarFallback>
      </Avatar>
      <span className="text-xs font-medium sm:text-sm">{userName || 'Sin asignar'}</span>
    </div>
  );
};
