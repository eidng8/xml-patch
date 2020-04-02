import {Patcher} from '../src';
import {InvalidAttributeValue, UnlocatedNode} from '../src/errors';

describe('Patcher', () => {
  test('it throws error if `sel` were missing', () => {
    expect.assertions(1);
    expect(() => new Patcher()
      .load('<diff><replace><c>y</c></replace></diff>')
      .patch('<a>x<b>y</b>z</a>'),
    ).toThrow(InvalidAttributeValue);
  });

  test('it throws if `sel` matches no target', () => {
    expect.assertions(1);
    expect(() => new Patcher()
      .load('<diff><replace sel="b/c"><c>y</c></replace></diff>')
      .patch('<a>x<b>y<c/></b>z</a>'),
    ).toThrow(UnlocatedNode);
  });

  test('it throws if matched multiple target', () => {
    expect.assertions(1);
    expect(() => new Patcher()
      .load('<diff><add sel="a/b"><c>y</c></add></diff>')
      .patch('<a>x<b>y</b><b>y</b>z</a>').toString(),
    ).toThrow(UnlocatedNode);
  });
});
