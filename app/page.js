import { getMenu } from '@/lib/store';
import { weeksBehind, todayName, fmtDate, weekLabel } from '@/lib/week';
import MenuView from './MenuView';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const menu = await getMenu();

  if (!menu) {
    return (
      <main className="page">
        <h1 className="title">Menu</h1>
        <p className="muted">No menu has been uploaded yet.</p>
      </main>
    );
  }

  const behind = weeksBehind(menu.uploadedAt);
  const status = {
    stale: behind > 0,
    behind,
    updated: fmtDate(menu.uploadedAt, true),
    updatedDay: fmtDate(menu.uploadedAt),
    week: weekLabel(menu.uploadedAt),
    today: todayName(),
  };
  return (
    <main className="page">
      <MenuView menu={menu} status={status} />
    </main>
  );
}
