import {Patch} from '../src';

describe('Patcher <replace>', () => {
  test('it replaces target element with multiple elements', () => {
    expect.assertions(1);
    expect(new Patch()
      .load('<diff><replace sel="/a/b"><c/><d/><e/></replace></diff>')
      .patch('<a>x<b>y</b>z</a>')
      .toString({minify: true, preserveComments: true}),
    ).toEqual('<a>x<c/><d/><e/>z</a>');
  });
});
