// import format from 'xml-formatter';
import {XMLSerializerImpl} from 'xmldom-ts';

const pd = require('pretty-data').pd;
const format = (xml: string) => pd.xml(xml);

declare global {
  namespace jest {
    interface Matchers<R> {
      toEqualXml(expected: Node | string): CustomMatcherResult;
    }
  }
}

expect.extend({
  toEqualXml(received: Node | string, expected: Node | string) {
    let strReceived: string, strExpected: string;

    if ('string' == typeof received) {
      strReceived = received.trim();
    } else {
      const serializer = new XMLSerializerImpl();
      strReceived = serializer.serializeToString(received).trim();
    }
    const fmtReceived = format(strReceived);

    if ('string' == typeof expected) {
      strExpected = expected.trim();
    } else {
      const serializer = new XMLSerializerImpl();
      strExpected = serializer.serializeToString(expected).trim();
    }
    const fmtExpected = format(strExpected);

    return {
      actual: fmtReceived,
      expected: fmtExpected,
      pass: fmtReceived == fmtExpected,
      message: () => {
        const strDiff = this.utils.diff(fmtExpected, fmtReceived, {expand: this.expand});
        let msg = this.utils.matcherHint(
          'toEqualXml',
          'received',
          'expected',
          {promise: this.promise});
        if (strDiff && strDiff.includes('- Expect')) {
          msg += `\n\n${strDiff}`;
        } else {
          msg += `\nExpected: ${this.utils.printExpected(fmtExpected)}\n`;
          msg += `\nReceived: ${this.utils.printReceived(fmtReceived)}`;
        }
        return msg;
      },
    };

    // return {
    //   actual: strReceived,
    //   expected: strExpected,
    //   pass: strExpected == strReceived,
    //   message: () => {
    //     const strDiff = this.utils.diff(strExpected, strReceived, {expand: this.expand});
    //     let msg = this.utils.matcherHint(
    //       'toEqualXml',
    //       'received',
    //       'expected',
    //       {promise: this.promise});
    //     if (strDiff && strDiff.includes('- Expect')) {
    //       msg += `\n\n${strDiff}`;
    //     } else {
    //       msg += `\nExpected: ${this.utils.printExpected(strExpected)}\n`;
    //       msg += `\nReceived: ${this.utils.printReceived(strReceived)}`;
    //     }
    //     return msg;
    //   },
    // };
  },
});
