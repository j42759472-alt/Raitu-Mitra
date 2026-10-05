import { useParams } from 'react-router-dom';
import { getHomeSection } from '@/lib/homeCatalog';
import CategoryGrid from '@/components/CategoryGrid';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';

export default function MorePage() {
  const { sectionId } = useParams<{ sectionId: string }>();
  const section = sectionId ? getHomeSection(sectionId) : undefined;

  if (!section) {
    return (
      <div>
        <PageHeader title="Categories" />
        <EmptyState title="Section not found" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={section.title} />
      <div className="page">
        <CategoryGrid items={section.items} />
      </div>
    </div>
  );
}
