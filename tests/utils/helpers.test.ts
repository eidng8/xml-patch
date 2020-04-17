/*
 * GPLv3 https://www.gnu.org/licenses/gpl-3.0.en.html
 *
 * Author: eidng8
 */

import XmlWrapper from '../../src/xml/xml-wrapper';
import { descend } from '../../src';
import { NodeImpl } from 'xmldom-ts';

describe('Helpers', () => {
  it('descends breadth-first', () => {
    expect.assertions(1);
    const xml = new XmlWrapper().fromString(
      `
<a1>
    <b1>
        <c1>
            <d1/>
        </c1>
    </b1>
    <b2>
        <c2>
            <d2>
                a
            </d2>
        </c2>
        <c3/>
    </b2>
    <b3/>
</a1>
`.replace(/\s/g, ''),
    );
    const actual = [] as string[];
    descend(xml.root!, n => actual.push(n.nodeName));
    expect(actual).toEqual([
      'b1',
      'b2',
      'b3',
      'c1',
      'c2',
      'c3',
      'd1',
      'd2',
      '#text',
    ]);
  });

  it('descending breaks out early', () => {
    expect.assertions(2);
    const xml = new XmlWrapper().fromString('<a><b/><c/><d/></a>');
    const actual = [] as string[];
    const node = descend(xml.root!, n => {
      actual.push(n.nodeName);
      return true;
    });
    expect(actual).toEqual(['b']);
    expect(node).toBe(xml.root!.firstChild);
  });

  it('return null from nothing', () => {
    let r = 0;
    // @ts-ignore
    expect(descend(<NodeImpl>null, () => r++)).toBeNull();
    expect(r).toBe(0);
  });
});
