/*
 * GPLv3 https://www.gnu.org/licenses/gpl-3.0.en.html
 *
 * Author: eidng8
 */

import {NodeImpl} from 'xmldom-ts';
import {XML} from '../src';

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
    xml = xml.toString();
  }
  xml = new XML({warnError: true})
    .fromString(xml)
    .toString({minify: true, preserveComments: true})
    .trim()
    .replace(/(?:(>)\s+|\s+(<))/g, '$1$2')
    .replace(/\r/g, '');
  return pd.xml(xml);
}
