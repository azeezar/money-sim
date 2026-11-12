import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MECHS } from '.';

describe('lesson mechanics', () => {
  it('all render without crashing', () => {
    for (const [id, M] of Object.entries(MECHS)) expect(renderToString(<M onDone={() => {}} />), id).toContain('<');
  });
});
