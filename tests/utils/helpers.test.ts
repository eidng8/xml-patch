/*
 * GPLv3 https://www.gnu.org/licenses/gpl-3.0.en.html
 *
 * Author: eidng8
 */

import { NodeImpl, DOMParserImpl, DocumentImpl } from 'xmldom-ts';
import { descend, removeEmptyTextNodes, trimTextContents } from '../../src';
import '../helpers';

describe('Helpers', () => {
  it('descends breadth-first', () => {
    expect.assertions(1);
    const xml = new DOMParserImpl().parseFromString(
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
    ) as DocumentImpl;
    const actual = [] as string[];
    descend(xml.documentElement, n => actual.push(n.nodeName));
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
    const xml = new DOMParserImpl().parseFromString(
      '<a><b/><c/><d/></a>',
    ) as DocumentImpl;
    const actual = [] as string[];
    const node = descend(xml.documentElement, n => {
      actual.push(n.nodeName);
      return true;
    });
    expect(actual).toEqual(['b']);
    expect(node).toBe(xml.documentElement.firstChild);
  });

  it('returns null from nothing', () => {
    let r = 0;
    // @ts-ignore
    expect(descend(<NodeImpl>null, () => r++)).toBeNull();
    expect(r).toBe(0);
  });

  it('removes empty text nodes', () => {
    expect.assertions(1);
    const xml = new DOMParserImpl().parseFromString(
      '<a> <b/></a>',
    ) as DocumentImpl;
    removeEmptyTextNodes(xml.documentElement);
    expect(xml).toEqualXml('<a><b/></a>');
  });

  it('trims text nodes', () => {
    expect.assertions(1);
    const xml = new DOMParserImpl().parseFromString(
      '<a> a<b/></a>',
    ) as DocumentImpl;
    trimTextContents(xml.documentElement);
    expect(xml).toEqualXml('<a>a<b/></a>');
  });
});
