/*
 * GPLv3 https://www.gnu.org/licenses/gpl-3.0.en.html
 *
 * Author: eidng8
 */

import Exception from './Exception';

const pd = require('pretty-data').pd;

/**
 * A list of arbitrary exceptions.
 */
export default class ExceptionBag extends Exception {
  /**
   * @inheritDoc
   */
  protected tag: string = '';

  /**
   * List of errors
   */
  protected exceptions: Exception[];

  /**
   * Returns whether there is any error in the bag.
   */
  get hasException(): boolean {
    return this.exceptions.length > 0;
  }

  /**
   * @inheritDoc
   */
  constructor() {
    super();
    this.exceptions = [];
  }

  /**
   * Push the given exception to the bag.
   * @param exception
   */
  push(exception: Exception) {
    this.exceptions.push(exception);
  }

  public toString(): string {
    const root = this.createRootNode();
    this.exceptions.forEach(e => root.appendChild(e.createErrorNode(this.xml)));
    return pd.xml(this.xml.toString());
  }
}
