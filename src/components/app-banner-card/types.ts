export interface AppBannerCardProps {
  banner: {
    id: string;
    title: string;
    subtitle: string;
    imageId?: string | null;
    isActive: boolean;
    sortOrder: number;
    startsAt?: string | null;
    endsAt?: string | null;
    app: {
      name?: string;
      category: {
        name: string;
      };
      tags?: string[] | { name: string }[];
      instructions?: string;
      ctaLabel: string;
      badgeLabel?: string | null;
      iconId?: string | null;
    };
  };
  onEdit?: () => void;
  onDelete?: () => void;
}
