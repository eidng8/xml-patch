import {Patcher} from '../src';

describe('Patcher <remove>', () => {
  test('it removes target element', () => {
    expect.assertions(1);
    expect(new Patcher()
      .load('<diff><remove sel="/a/b"/></diff>')
      .patch('<a>x<b>y</b>z</a>').toString(),
    ).toEqual('<a>xz</a>');
  });

  test('it also removes white space text node before target', () => {
    expect.assertions(1);
    expect(new Patcher()
      .load('<diff><remove sel="/a/b" ws="before"/></diff>')
      .patch('<a>\n   \n<b>y</b>\nz</a>').toString(),
    ).toEqual('<a>\nz</a>');
  });

  test('it also removes white space text node after target', () => {
    expect.assertions(1);
    expect(new Patcher()
      .load('<diff><remove sel="/a/b" ws="after"/></diff>')
      .patch('<a>x\n<b>y</b>\n   \n</a>').toString(),
    ).toEqual('<a>x\n</a>');
  });

  test('it also removes white space text node around target', () => {
    expect.assertions(1);
    expect(new Patcher()
      .load('<diff><remove sel="/a/b" ws="both"/></diff>')
      .patch('<a>\n   \n<b>y</b>\n   \n</a>').toString(),
    ).toEqual('<a/>');
  });

  test('it does not removes non white space text node', () => {
    expect.assertions(1);
    expect(new Patcher()
      .load('<diff><remove sel="/a/b" ws="both"/></diff>')
      .patch('<a>\nx\n<b>y</b>\nz\n</a>').toString(),
    ).toEqual('<a>\nx\n\nz\n</a>');
  });

  test('it does not removes other nodes', () => {
    expect.assertions(1);
    expect(new Patcher()
      .load('<diff><remove sel="/a/b" ws="both"/></diff>')
      .patch('<a><d/><b>y</b><c/></a>').toString(),
    ).toEqual('<a><d/><c/></a>');
  });

  test('it does not removes comment', () => {
    expect.assertions(1);
    expect(new Patcher()
      .load('<diff><remove sel="a/comment()[1]"/></diff>')
      .patch('<a><!--d/--><b>y</b></a>').toString(),
    ).toEqual('<a><b>y</b></a>');
  });
});
