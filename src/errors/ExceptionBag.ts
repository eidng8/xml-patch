/*
 * GPLv3 https://www.gnu.org/licenses/gpl-3.0.en.html
 *
 * Author: eidng8
 */

import Exception from './Exception';

/**
 * A list of arbitrary exceptions.
 */
export default class ExceptionBag extends Exception {
  protected tag: string = '';

  protected exceptions: Exception[];

  get hasException(): boolean {
    return this.exceptions.length > 0;
  }

  constructor() {
    super();
    this.exceptions = [];
  }

  push(exception: Exception) {
    this.exceptions.push(exception);
  }

  public toString(): string {
    const root = this.createRootNode();
    this.exceptions.forEach(e =>
      root.appendChild(e.createErrorNode(this.xml.doc)),
    );
    return this.xml.toString({ pretty: true, preserveComments: true });
  }
}
