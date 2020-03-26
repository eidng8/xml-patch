import {NodeImpl, XMLSerializerImpl} from 'xmldom-ts';
import {XMLFile} from '../src';

const pd = require('pretty-data').pd;

declare global {
  namespace jest {
    interface Matchers<R> {
      toEqualXml(expected: Node | string): CustomMatcherResult;
    }
  }
}

expect.extend({
  toEqualXml(received: Node | string, expected: Node | string) {
    const fmtReceived = format(received);
    const fmtExpected = format(expected);

    return {
      actual: fmtReceived,
      expected: fmtExpected,
      pass: fmtReceived == fmtExpected,
      message: () => {
        const strDiff = this.utils.diff(
          fmtExpected,
          fmtReceived,
          {expand: this.expand},
        );
        let msg = this.utils.matcherHint(
          'toEqualXml',
          'received',
          'expected',
          {promise: this.promise},
        );
        if (strDiff && strDiff.includes('- Expect')) {
          msg += `\n\n${strDiff}`;
        } else {
          msg += `\nExpected: ${this.utils.printExpected(fmtExpected)}\n`;
          msg += `\nReceived: ${this.utils.printReceived(fmtReceived)}`;
        }
        return msg;
      },
    };
  },
});

export function format(txt: string | NodeImpl | Node) {
  let xml = txt;
  if ('string' != typeof xml) {
    xml = new XMLSerializerImpl().serializeToString(xml);
  }
  xml = new XMLFile({warnError: true})
    .fromString(xml)
    .toString(true, true)
    .trim()
    .replace(/(?:(>)\s+|\s+(<))/g, '$1$2');
  return pd.xml(xml);
}
