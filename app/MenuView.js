'use client';
import { useRef, useState } from 'react';

const short = (d) => (d || '').slice(0, 3);

export default function MenuView({ menu, status }) {
  const days = menu.days || [];
  const todayIdx = days.findIndex((d) => d.day === status.today);
  const [i, setI] = useState(!status.stale && todayIdx >= 0 ? todayIdx : 0);
  const dlg = useRef(null);
  const day = days[i];
  const isToday = !status.stale && day?.day === status.today;

  return (
    <>
      <header className="head">
        <h1 className="title">{menu.title || 'Menu'}</h1>
        {!status.stale && (
          <p className="updated"><span className="dot" />Updated {status.updated}</p>
        )}
      </header>

      {status.stale && (
        <div className="stale" role="status">
          <strong>This is not this week’s menu.</strong>
          <span>
            It is from the week of {status.week}
            {status.behind > 1 ? ` (${status.behind} weeks ago)` : ''}, last updated {status.updated}.
          </span>
        </div>
      )}

      {menu.needs_review && (
        <div className="review" role="status">
          <span>Some items may not have been read correctly.</span>
          <button onClick={() => dlg.current?.showModal()}>View original image</button>
        </div>
      )}

      {days.length > 0 && (
        <>
          <nav className="chips" aria-label="Day">
            {days.map((d, k) => (
              <button
                key={d.day + k}
                className={k === i ? 'chip on' : 'chip'}
                aria-pressed={k === i}
                onClick={() => setI(k)}
              >
                {short(d.day)}
                {!status.stale && d.day === status.today && <i aria-label="today" />}
              </button>
            ))}
          </nav>

          <section className="day">
            <h2>{day.day}{isToday && <span className="today">today</span>}</h2>
            {(day.meals || []).map((m, k) => (
              <div className="meal" key={m.name + k}>
                <h3>{m.name}</h3>
                <p>{(m.items || []).join(', ')}</p>
              </div>
            ))}
          </section>
        </>
      )}

      {menu.notes && <p className="notes">{menu.notes}</p>}

      <dialog ref={dlg} className="viewer" onClick={(e) => e.target === dlg.current && dlg.current.close()}>
        <button className="close" onClick={() => dlg.current.close()}>Close</button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={menu.imageUrl} alt="Original menu" />
      </dialog>
    </>
  );
}
