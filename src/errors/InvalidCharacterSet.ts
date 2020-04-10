/*
 * GPLv3 https://www.gnu.org/licenses/gpl-3.0.en.html
 *
 * Author: eidng8
 */

import Exception from './Exception';

/**
 * The patch could not be applied because the diff and the patched document use
 * different character sets.
 */
export default class InvalidCharacterSet extends Exception {
  protected tag: string = 'invalid-character-set';

  constructor() {
    super(Exception.ErrEncoding);
  }
}
