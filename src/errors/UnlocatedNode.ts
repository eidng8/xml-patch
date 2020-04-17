/*
 * GPLv3 https://www.gnu.org/licenses/gpl-3.0.en.html
 *
 * Author: eidng8
 */

import Exception from './Exception';

/**
 * A single unique node (typically an element) could not be located with the
 * 'sel' attribute value.  Also, the location of multiple nodes can lead to this
 * error.
 */
export default class UnlocatedNode extends Exception {
  /**
   * @inheritDoc
   */
  protected tag: string = 'unlocated-node';
}
