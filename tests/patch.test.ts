/*
 * GPLv3 https://www.gnu.org/licenses/gpl-3.0.en.html
 *
 * Author: eidng8
 */

import {
  InvalidAttributeValue,
  InvalidCharacterSet,
  Patch,
  UnlocatedNode,
} from '../src';
import XmlWrapper from '../src/xml-wrapper';

describe('Patch', () => {
  it('throws error if `sel` were missing', () => {
    expect.assertions(1);
    expect(() => new Patch()
      .load('<diff><replace><c>y</c></replace></diff>')
      .patch('<a>x<b>y</b>z</a>'),
    ).toThrow(InvalidAttributeValue);
  });

  it('throws if `sel` matches no target', () => {
    require('../src/translations/zh_chs');
    expect.assertions(2);
    try {
      new Patch()
        .load('<diff><replace sel="b/c"><c>y</c></replace></diff>')
        .patch('<a>x<b>y<c/></b>z</a>');
    } catch (e) {
      expect(e).toBeInstanceOf(UnlocatedNode);
      expect(e.message).toBe('无法找到匹配节点。');
    }
  });

  it('throws if matched multiple target', () => {
    require('../src/translations/zh_cht');
    expect.assertions(2);
    try {
      new Patch()
        .load('<diff><add sel="a/b"><c>y</c></add></diff>')
        .patch('<a>x<b>y</b><b>y</b>z</a>');
    } catch (e) {
      expect(e).toBeInstanceOf(UnlocatedNode);
      expect(e.message).toBe('匹配到了多個節點。');
    }
  });

  it('throws if encoding is not same', () => {
    expect.assertions(1);
    const d = new XmlWrapper({defaultEncoding: 'ascii'}).fromString('<a/>');
    const x = new XmlWrapper({defaultEncoding: 'utf-8'}).fromString('<a/>');
    expect(() => new Patch().load(d).patch(x)).toThrow(InvalidCharacterSet);
  });
});
