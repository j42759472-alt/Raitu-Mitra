import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PageHeader({
  title,
  subtitle,
  backTo,
}: {
  title: string;
  subtitle?: string;
  backTo?: string;
}) {
  const navigate = useNavigate();
  const goBack = () => {
    if (backTo) navigate(backTo);
    else navigate(-1);
  };

  return (
    <header
      style={{
        background: '#2E7D32',
        color: 'white',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <button
        type="button"
        onClick={goBack}
        aria-label="Back"
        style={{ color: 'white', padding: 4, display: 'flex' }}
      >
        <ArrowLeft size={22} />
      </button>
      <div>
        <h1 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{title}</h1>
        {subtitle && (
          <p style={{ margin: 0, fontSize: 12, opacity: 0.9 }}>{subtitle}</p>
        )}
      </div>
    </header>
  );
}
