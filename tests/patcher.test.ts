import {Patcher} from '../src';
import {XPatchException} from '../src/errors';

describe('Patcher', () => {
  test('it ignores actions without `sel` attribute', () => {
    expect.assertions(1);
    const diff = '<diff><replace><c>y</c></replace></diff>';
    const xml = '<a>x<b>y</b>z</a>';
    expect(new Patcher().load(diff).patch(xml).toString()).toEqual(xml);
  });

  test('it ignores actions that matches no target', () => {
    expect.assertions(1);
    const xml = '<a>x<b>y<c/></b>z</a>';
    // RFC 4.1, second paragraph: 'sel' attribute always start from root node
    expect(new Patcher()
      .load('<diff><replace sel="b/c"><c>y</c></replace></diff>')
      .patch(xml).toString(),
    ).toEqual(xml);
  });

  test('it throws if matched multiple target', () => {
    expect.assertions(1);
    expect(() => new Patcher()
      .load('<diff><add sel="a/b"><c>y</c></add></diff>')
      .patch('<a>x<b>y</b><b>y</b>z</a>').toString(),
    ).toThrow(XPatchException);
  });
});
