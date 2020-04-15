/*
 * GPLv3 https://www.gnu.org/licenses/gpl-3.0.en.html
 *
 * Author: eidng8
 */

import {
  dontIgnoreExceptions,
  ignoreExceptions,
  InvalidAttributeValue,
  InvalidCharacterSet,
  InvalidNamespacePrefix,
  InvalidNodeTypes,
  InvalidPatchDirective,
  InvalidWhitespaceDirective,
  Patch,
  setExceptionHandler,
  UnlocatedNode,
} from '../src';
import InvalidRootElementOperation from '../src/errors/InvalidRootElementOperation';
import './helpers';

/**
 * All tests here must check the target document is not changed
 * unintentionally or unexpectedly.
 */
describe('Patch ignoring errors', () => {
  beforeAll(() => dontIgnoreExceptions());

  afterAll(() => dontIgnoreExceptions());

  it('does not throw on empty patch document', () => {
    expect.assertions(2);
    expect(() => {
      expect(new Patch().load('<diff/>').patch('<a>x<b>y</b>z</a>')).toEqualXml(
        '<a>x<b>y</b>z</a>',
      );
    }).not.toThrow();
  });

  it('does not throw if no target found', () => {
    expect.assertions(4);
    ignoreExceptions([UnlocatedNode]);
    let raised = 0;
    setExceptionHandler(ex => {
      raised++;
      expect(ex).toBeInstanceOf(UnlocatedNode);
    });
    expect(() => {
      expect(
        new Patch()
          .load('<diff><add sel="c"/></diff>')
          .patch('<a>x<b>y</b>z</a>'),
      ).toEqualXml('<a>x<b>y</b>z</a>');
    }).not.toThrow();
    expect(raised).toBe(1);
  });

  it('does not throw ignored error', () => {
    expect.assertions(3);
    ignoreExceptions(InvalidAttributeValue, InvalidCharacterSet);
    setExceptionHandler(ex => {
      expect(ex).toBeInstanceOf(InvalidAttributeValue);
    });
    expect(() => {
      expect(
        new Patch()
          .load('<diff><replace><c>y</c></replace></diff>')
          .patch('<a>x<b>y</b>z</a>'),
      ).toEqualXml('<a>x<b>y</b>z</a>');
    }).not.toThrow();
  });

  it('ignores missing `sel` attribute', () => {
    expect.assertions(4);
    ignoreExceptions([InvalidAttributeValue]);
    let raised = 0;
    setExceptionHandler(ex => {
      raised++;
      expect(ex).toBeInstanceOf(InvalidAttributeValue);
    });
    expect(() => {
      expect(
        new Patch().load('<diff><add/></diff>').patch('<a>x<b>y</b>z</a>'),
      ).toEqualXml('<a>x<b>y</b>z</a>');
    }).not.toThrow();
    expect(raised).toBe(1);
  });

  it('ignores empty `sel` attribute', () => {
    expect.assertions(4);
    ignoreExceptions([InvalidAttributeValue]);
    let raised = 0;
    setExceptionHandler(ex => {
      raised++;
      expect(ex).toBeInstanceOf(InvalidAttributeValue);
    });
    expect(() => {
      expect(
        new Patch()
          .load('<diff><add sel="  "/></diff>')
          .patch('<a>x<b>y</b>z</a>'),
      ).toEqualXml('<a>x<b>y</b>z</a>');
    }).not.toThrow();
    expect(raised).toBe(1);
  });

  it('ignores invalid directive', () => {
    expect.assertions(4);
    ignoreExceptions([InvalidPatchDirective]);
    let raised = 0;
    setExceptionHandler(ex => {
      raised++;
      expect(ex).toBeInstanceOf(InvalidPatchDirective);
    });
    expect(() => {
      expect(
        new Patch()
          .load('<diff><wrong sel="a"/></diff>')
          .patch('<a>x<b>y</b>z</a>'),
      ).toEqualXml('<a>x<b>y</b>z</a>');
    }).not.toThrow();
    expect(raised).toBe(1);
  });

  it('ignores non-text attribute action', () => {
    expect.assertions(7);
    ignoreExceptions([InvalidNodeTypes]);
    let raised = 0;
    setExceptionHandler(ex => {
      raised++;
      expect(ex).toBeInstanceOf(InvalidNodeTypes);
    });
    expect(() => {
      expect(
        new Patch()
          .load('<diff><add sel="a" type="@c"><c>ccc</c></add></diff>')
          .patch('<a>x<b>y</b>z</a>')
          .toString({ minify: true }),
      ).toBe('<a>x<b>y</b>z</a>');
    }).not.toThrow();
    expect(() => {
      expect(
        new Patch()
          .load(
            '<diff><add sel="a" type="attribute::c"><c>ccc</c></add></diff>',
          )
          .patch('<a>x<b>y</b>z</a>'),
      ).toEqualXml('<a>x<b>y</b>z</a>');
    }).not.toThrow();
    expect(raised).toBe(2);
  });

  it('ignores non-text namespace action', () => {
    expect.assertions(5);
    ignoreExceptions([InvalidNodeTypes, InvalidPatchDirective]);
    let raised = 0;
    const exceptions = [InvalidNodeTypes, InvalidPatchDirective];
    setExceptionHandler(ex => {
      expect(ex).toBeInstanceOf(exceptions[raised++]);
    });
    expect(() => {
      expect(
        new Patch()
          .load(
            '<diff><add sel="a" type="namespace::c"><c>ccc</c></add></diff>',
          )
          .patch('<a>x<b>y</b>z</a>'),
      ).toEqualXml('<a>x<b>y</b>z</a>');
    }).not.toThrow();
    expect(raised).toBe(2);
  });

  it('ignores invalid target for attribute action', () => {
    expect.assertions(4);
    ignoreExceptions(InvalidNodeTypes);
    let raised = 0;
    setExceptionHandler(ex => {
      expect(ex).toBeInstanceOf(InvalidNodeTypes);
      raised++;
    });
    expect(() => {
      expect(
        new Patch()
          .load('<diff><add sel="a/text()" type="@c"/></diff>')
          .patch('<a>x</a>'),
      ).toEqualXml('<a>x</a>');
    }).not.toThrow();
    expect(raised).toBe(1);
  });

  it('ignores adding root element', () => {
    expect.assertions(7);
    ignoreExceptions(InvalidRootElementOperation);
    let raised = 0;
    setExceptionHandler(ex => {
      expect(ex).toBeInstanceOf(InvalidRootElementOperation);
      raised++;
    });
    expect(() => {
      expect(
        new Patch()
          .load('<diff><add sel="a" pos="before"><c/></add></diff>')
          .patch('<a>x</a>')
          .toString({ minify: true }),
      ).toBe('<a>x</a>');
    }).not.toThrow();
    expect(() => {
      expect(
        new Patch()
          .load('<diff><add sel="a" pos="after"><c/></add></diff>')
          .patch('<a>x</a>'),
      ).toEqualXml('<a>x</a>');
    }).not.toThrow();
    expect(raised).toBe(2);
  });

  it('ignores removing root element', () => {
    expect.assertions(4);
    ignoreExceptions(InvalidRootElementOperation);
    let raised = 0;
    setExceptionHandler(ex => {
      expect(ex).toBeInstanceOf(InvalidRootElementOperation);
      raised++;
    });
    expect(() => {
      expect(
        new Patch().load('<diff><remove sel="a"/></diff>').patch('<a>x</a>'),
      ).toEqualXml('<a>x</a>');
    }).not.toThrow();
    expect(raised).toBe(1);
  });

  it('ignores replacing root', () => {
    expect.assertions(4);
    ignoreExceptions(InvalidRootElementOperation);
    let raised = 0;
    setExceptionHandler(ex => {
      expect(ex).toBeInstanceOf(InvalidRootElementOperation);
      raised++;
    });
    expect(() => {
      expect(
        new Patch()
          .load('<diff><replace sel="a"><b/></replace></diff>')
          .patch('<a/>'),
      ).toEqualXml('<a/>');
    }).not.toThrow();
    expect(raised).toBe(1);
  });

  it('ignores used namespace', () => {
    expect.assertions(4);
    ignoreExceptions(InvalidNamespacePrefix);
    let raised = 0;
    setExceptionHandler(ex => {
      expect(ex).toBeInstanceOf(InvalidNamespacePrefix);
      raised++;
    });
    expect(() => {
      expect(
        new Patch()
          .load('<diff><remove sel="a/namespace::p"/></diff>')
          .patch('<p:a xmlns:p="urn:xxx"><p:b/>x</p:a>'),
      ).toEqualXml('<p:a xmlns:p="urn:xxx"><p:b/>x</p:a>');
    }).not.toThrow();
    expect(raised).toBe(1);
  });

  it('ignores non-exist namespace', () => {
    expect.assertions(4);
    ignoreExceptions(InvalidNamespacePrefix);
    let raised = 0;
    setExceptionHandler(ex => {
      expect(ex).toBeInstanceOf(InvalidNamespacePrefix);
      raised++;
    });
    expect(() => {
      expect(
        new Patch()
          .load('<diff><remove sel="a/namespace::p"/></diff>')
          .patch('<a>x</a>'),
      ).toEqualXml('<a>x</a>');
    }).not.toThrow();
    expect(raised).toBe(1);
  });

  it('ignores non-exist namespace URI', () => {
    expect.assertions(4);
    ignoreExceptions(InvalidNamespacePrefix);
    let raised = 0;
    setExceptionHandler(ex => {
      expect(ex).toBeInstanceOf(InvalidNamespacePrefix);
      raised++;
    });
    expect(() => {
      expect(
        new Patch()
          .load('<diff><replace sel="a/namespace::p"/>urn:yyy</diff>')
          .patch('<a xmlns="urn:xxx">x</a>'),
      ).toEqualXml('<a xmlns="urn:xxx">x</a>');
    }).not.toThrow();
    expect(raised).toBe(1);
  });

  // region Side Effects
  it('replaces target element with multiple elements', () => {
    expect.assertions(2);
    ignoreExceptions(InvalidNodeTypes);
    setExceptionHandler(ex => {
      expect(ex).toBeInstanceOf(InvalidNodeTypes);
    });
    expect(
      new Patch()
        .load('<diff><replace sel="/a/b"><c/><d/><e/></replace></diff>')
        .patch('<a>x<b>y</b>z</a>'),
    ).toEqualXml('<a>x<c/><d/><e/>z</a>');
  });

  it('adds to multiple targets', () => {
    expect.assertions(3);
    ignoreExceptions(UnlocatedNode);
    let raised = 0;
    setExceptionHandler(ex => {
      raised++;
      expect(ex).toBeInstanceOf(UnlocatedNode);
    });
    expect(
      new Patch()
        .load('<diff><add sel="/a/b"><c/><d/><e/></add></diff>')
        .patch('<a>x<b>y</b>z<b/></a>'),
    ).toEqualXml('<a>x<b>y<c/><d/><e/></b>z<b><c/><d/><e/></b></a>');
    expect(raised).toBe(1);
  });

  it('replaces multiple targets', () => {
    expect.assertions(5);
    ignoreExceptions([UnlocatedNode, InvalidNodeTypes]);
    let raised = 0;
    const exceptions = [UnlocatedNode, InvalidNodeTypes, InvalidNodeTypes];
    setExceptionHandler(ex => {
      expect(ex).toBeInstanceOf(exceptions[raised++]);
    });
    expect(
      new Patch()
        .load('<diff><replace sel="/a/b"><c/><d/><e/></replace></diff>')
        .patch('<a>x<b>y</b>z<b/></a>'),
    ).toEqualXml('<a>x<c/><d/><e/>z<c/><d/><e/></a>');
    expect(raised).toBe(3);
  });

  it('removes multiple targets', () => {
    expect.assertions(3);
    ignoreExceptions(UnlocatedNode);
    let raised = 0;
    setExceptionHandler(ex => {
      raised++;
      expect(ex).toBeInstanceOf(UnlocatedNode);
    });
    expect(
      new Patch()
        .load('<diff><remove sel="/a/b"/></diff>')
        .patch('<a>x<b>y</b>z<b/></a>'),
    ).toEqualXml('<a>xz</a>');
    expect(raised).toBe(1);
  });

  it('removes attribute with `ws`', () => {
    expect.assertions(4);
    ignoreExceptions(InvalidWhitespaceDirective);
    let raised = 0;
    setExceptionHandler(ex => {
      raised++;
      expect(ex).toBeInstanceOf(InvalidWhitespaceDirective);
    });
    expect(() => {
      expect(
        new Patch()
          .load('<diff><remove sel="/a/@b" ws="before"/></diff>')
          .patch('<a b=""/>'),
      ).toEqualXml('<a/>');
    }).not.toThrow();
    expect(raised).toBe(1);
  });

  it('replaces mismatched node types', () => {
    expect.assertions(10);
    ignoreExceptions(InvalidNodeTypes);
    let raised = 0;
    setExceptionHandler(ex => {
      expect(ex).toBeInstanceOf(InvalidNodeTypes);
      raised++;
    });
    expect(() => {
      expect(
        new Patch()
          .load(
            '<diff><replace sel="a/processing-instruction()"><b/></replace></diff>',
          )
          .patch('<a><?pi ?></a>'),
      ).toEqualXml('<a><b/></a>');
    }).not.toThrow();
    expect(() => {
      expect(
        new Patch()
          .load('<diff><replace sel="a/comment()"><b/></replace></diff>')
          .patch('<a><!--b--></a>'),
      ).toEqualXml('<a><b/></a>');
    }).not.toThrow();
    expect(() => {
      expect(
        new Patch()
          .load('<diff><replace sel="a/text()"><b/></replace></diff>')
          .patch('<a><![CDATA[cdata]]></a>'),
      ).toEqualXml('<a><b/></a>');
    }).not.toThrow();
    expect(raised).toBe(3);
  });
  // endregion
});
