// Home page: three-pane layout
import Link from 'next/link';

const leftLinks = [
  { label: 'Microscope Slides', href: '/catalog?c=slides' },
  { label: 'Preserved Specimens', href: '/catalog?c=preserved' },
  { label: 'Live Cultures', href: '/catalog?c=cultures' },
  { label: 'Dissection Kits', href: '/catalog?c=dissection' },
];

const rightLinks = [
  { label: 'Classroom Kits', href: '/catalog?c=kits' },
  { label: 'Model Organisms', href: '/catalog?c=models' },
  { label: 'Reagents', href: '/catalog?c=reagents' },
  { label: 'Accessories', href: '/catalog?c=accessories' },
];

export default function HomePage() {
  return (
    <div className="three-pane">
      {/* Center: company intro + secondary CTA */}
      <section className="pane pane-center" aria-labelledby="hero-heading">
        <h1 id="hero-heading" className="hero-title">Niles Biological</h1>
        <p className="hero-subtitle">
          We supply classrooms and labs with reliable biological specimens, slides, and kits—so educators can focus on teaching.
        </p>
        <p className="hero-cta">
          <Link className="button-secondary" href="/catalog">Browse the Catalog</Link>
        </p>
      </section>

      {/* Right: quick-start links */}
      <aside className="pane pane-right" aria-labelledby="right-nav-heading">
        <h2 id="right-nav-heading" className="pane-title">Start Here</h2>
        <nav aria-label="Right catalog links">
          <ul className="pane-list">
            {rightLinks.map((l) => (
              <li key={l.href}>
                <Link className="nav-link" href={l.href}>{l.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Left: explore links */}
      <aside className="pane pane-left" aria-labelledby="left-nav-heading">
        <h2 id="left-nav-heading" className="pane-title">Explore</h2>
        <nav aria-label="Left catalog links">
          <ul className="pane-list">
            {leftLinks.map((l) => (
              <li key={l.href}>
                <Link className="nav-link" href={l.href}>{l.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </div>
  );
}
