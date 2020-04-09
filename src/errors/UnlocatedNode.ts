import Exception from './Exception';

/**
 * A single unique node (typically an element) could not be located with the
 * 'sel' attribute value.  Also, the location of multiple nodes can lead to this
 * error.
 */
export default class UnlocatedNode extends Exception {
  protected tag: string = 'unlocated-node';
}
