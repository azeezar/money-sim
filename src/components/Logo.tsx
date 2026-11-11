import black from '../assets/logo-black.png';
import white from '../assets/logo-white.png';

/** The Money Sim mark. `tone` forces a colour; by default it follows the light or dark theme. */
export function Logo({ height, tone }: { height: number; tone?: 'black' | 'white' }) {
  if (tone) return <img className="logo" src={tone === 'black' ? black : white} alt="Money Sim" style={{ height }} />;
  return (
    <span className="logo themed" role="img" aria-label="Money Sim">
      <img className="lb" src={black} alt="" style={{ height }} />
      <img className="lw" src={white} alt="" style={{ height }} />
    </span>
  );
}
