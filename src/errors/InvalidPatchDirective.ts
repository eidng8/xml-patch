/*
 * GPLv3 https://www.gnu.org/licenses/gpl-3.0.en.html
 *
 * Author: eidng8
 */

import Exception from './Exception';
import { NodeImpl } from 'xmldom-ts';

/**
 * A patch directive could not be fulfilled because the given directives were
 * not understood.
 */
export default class InvalidPatchDirective extends Exception {
  /**
   * @inheritDoc
   */
  protected tag: string = 'invalid-patch-directive';

  /**
   * @inheritDoc
   */
  constructor(message?: string, action?: NodeImpl) {
    super(message || Exception.ErrDirective, action);
    this.action = action;
  }
}
