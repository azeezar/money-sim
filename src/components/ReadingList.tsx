import { BOOKS, SHELVES } from '../data/books';
import { toggleRead, toggleReadingHidden } from '../state/actions';
import { useStore } from '../state/store';

/** Suggested books, grouped by shelf, each with a "read" tick. */
export function ReadingList() {
  const s = useStore();
  const read = Object.keys(s.reading).length;
  return (
    <section className="card reading" id="reading">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div>
          <span className="tag">Recommended reading</span>
          <h2>Books worth your time</h2>
        </div>
        <div className="row nowrap" style={{ gap: 6 }}>
          <span className="chip num">
            {read} / {BOOKS.length} read
          </span>
          <button className="btn ghost" onClick={toggleReadingHidden} aria-expanded={!s.readingHidden} aria-controls="reading-body">
            {s.readingHidden ? 'Show' : 'Hide'}
          </button>
        </div>
      </div>
      {!s.readingHidden && (
        <div id="reading-body" className="col" style={{ gap: 14 }}>
          <p className="muted small">Suggestions to go deeper on saving and investing. Libraries and second-hand shops often have them. None is personal advice.</p>
          {SHELVES.map((shelf, i) => (
            <div key={shelf} className="col" style={{ gap: 8 }}>
              <h3 className={`shelf s${i}`}>{shelf}</h3>
              {BOOKS.filter((b) => b.shelf === shelf).map((b) => (
                <label key={b.id} className={'book' + (s.reading[b.id] ? ' done' : '')}>
                  <input type="checkbox" checked={!!s.reading[b.id]} onChange={() => toggleRead(b.id)} />
                  <span className={`spine s${i}`} aria-hidden="true" />
                  <span className="grow">
                    <b>{b.title}</b> <span className="muted small">by {b.author}</span>
                    <br />
                    <span className="small">{b.why}</span>
                  </span>
                </label>
              ))}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
