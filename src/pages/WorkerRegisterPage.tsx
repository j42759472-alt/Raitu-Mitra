import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  WORKFORCE_SHORT_CATEGORIES,
  WORKFORCE_SUB_CATEGORIES,
  SUB_CATEGORY_SKILLS,
  registrationCategoryLabel,
  type WorkforceShortCategory,
} from '@/lib/workerRegistration';
import { createWorkerRegistration } from '@/lib/products';
import { useStore } from '@/store/useStore';
import { checkAndBlockWalletRestricted } from '@/lib/wallet';
import PageHeader from '@/components/PageHeader';

export default function WorkerRegisterPage() {
  const navigate = useNavigate();
  const user = useStore((s) => s.user);
  const [isGroup, setIsGroup] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<WorkforceShortCategory>('Farm');
  const [subCategory, setSubCategory] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [dailyPay, setDailyPay] = useState('');
  const [location, setLocation] = useState(user?.village ?? '');
  const [memberCount, setMemberCount] = useState('2');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);

  const subCategories = WORKFORCE_SUB_CATEGORIES[category] ?? [];
  const skillOptions = subCategory ? (SUB_CATEGORY_SKILLS[subCategory] ?? []) : [];

  const toggleSkill = (s: string) => {
    setSkills((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.full_name) return;
    const blocked = await checkAndBlockWalletRestricted(
      user.full_name,
      user.id,
      () => navigate('/payments'),
    );
    if (blocked) return;

    setLoading(true);
    try {
      await createWorkerRegistration({
        title: title || `${registrationCategoryLabel(category)} Worker`,
        category: registrationCategoryLabel(category),
        subCategory: subCategory || 'All',
        skills: skills.length ? skills : ['General'],
        startDate,
        endDate,
        dailyPay: Number(dailyPay),
        location,
        sellerName: user.full_name,
        sellerId: user.id,
        isGroup,
        memberCount: isGroup ? Number(memberCount) : 1,
      });
      window.alert('Registration submitted!');
      navigate('/workforce');
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Worker Registration" />
      <form className="page" style={{ maxWidth: 520 }} onSubmit={submit}>
        <div className="flex gap-sm mb-md">
          <button type="button" className={`chip ${!isGroup ? 'chip--active' : ''}`} onClick={() => setIsGroup(false)}>
            Single
          </button>
          <button type="button" className={`chip ${isGroup ? 'chip--active' : ''}`} onClick={() => setIsGroup(true)}>
            Group
          </button>
        </div>

        <label className="text-secondary" style={{ fontSize: 13 }}>Title</label>
        <input className="input mb-md" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Worker title" />

        <label className="text-secondary" style={{ fontSize: 13 }}>Category</label>
        <select
          className="input mb-md"
          value={category}
          onChange={(e) => {
            setCategory(e.target.value as WorkforceShortCategory);
            setSubCategory('');
            setSkills([]);
          }}
        >
          {WORKFORCE_SHORT_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {subCategories.length > 0 && (
          <>
            <label className="text-secondary" style={{ fontSize: 13 }}>Sub-category</label>
            <select className="input mb-md" value={subCategory} onChange={(e) => setSubCategory(e.target.value)}>
              <option value="">Select</option>
              {subCategories.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </>
        )}

        {skillOptions.length > 0 && (
          <div className="mb-md">
            <label className="text-secondary" style={{ fontSize: 13 }}>Skills</label>
            <div className="flex gap-sm mt-md" style={{ flexWrap: 'wrap' }}>
              {skillOptions.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`chip ${skills.includes(s) ? 'chip--active' : ''}`}
                  onClick={() => toggleSkill(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <label className="text-secondary" style={{ fontSize: 13 }}>Daily wage (₹)</label>
        <input className="input mb-md" type="number" value={dailyPay} onChange={(e) => setDailyPay(e.target.value)} required />

        {isGroup && (
          <>
            <label className="text-secondary" style={{ fontSize: 13 }}>Group size</label>
            <input className="input mb-md" type="number" min={2} value={memberCount} onChange={(e) => setMemberCount(e.target.value)} />
          </>
        )}

        <label className="text-secondary" style={{ fontSize: 13 }}>Available from</label>
        <input className="input mb-md" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />

        <label className="text-secondary" style={{ fontSize: 13 }}>Available until</label>
        <input className="input mb-md" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />

        <label className="text-secondary" style={{ fontSize: 13 }}>Location</label>
        <input className="input mb-md" value={location} onChange={(e) => setLocation(e.target.value)} />

        <button type="submit" className="btn btn-primary w-full" disabled={loading}>
          {loading ? 'Submitting…' : 'Register'}
        </button>
      </form>
    </div>
  );
}
