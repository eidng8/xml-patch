import Exception from './Exception';

/**
 * The node types of a <replace> operation did not match, i.e., for example, the
 * 'sel' selector locates an element but the replaceable content is of text
 * type.  Also, a <replace> operation may locate a unique element, but
 * replaceable content had multiple nodes.
 */
export default class InvalidNodeTypes extends Exception {
  protected tag: string = 'invalid-node-types';
}
