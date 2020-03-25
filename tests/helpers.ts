import format from 'xml-formatter';
import {XMLSerializerImpl} from 'xmldom-ts';

declare global {
  namespace jest {
    interface Matchers<R> {
      toEqualXml(expected: Node | string): CustomMatcherResult;
    }
  }
}

expect.extend({
  toEqualXml(received: Node | string, expected: Node | string) {
    let strReceived, strExpected;

    if ('string' == typeof received) {
      strReceived = received;
    } else {
      const serializer = new XMLSerializerImpl();
      strReceived = serializer.serializeToString(received);
    }
    const fmtReceived = format(strReceived);

    if ('string' == typeof expected) {
      strExpected = expected;
    } else {
      const serializer = new XMLSerializerImpl();
      strExpected = serializer.serializeToString(expected);
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
          msg += `Expected: ${this.utils.printExpected(expected)}\n`;
          msg += `Received: ${this.utils.printReceived(received)}`;
        }
        return msg;
      },
    };
  },
});
