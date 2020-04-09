import Exception from './Exception';
import {NodeImpl} from 'xmldom-ts';

/**
 * The root element of the document cannot be removed or another sibling element
 * for the document root element cannot be added.
 */
export default class InvalidRootElementOperation extends Exception {
  protected tag: string = 'invalid-root-element-operation';

  constructor(action?: NodeImpl) {
    super(Exception.ErrRoot, action);
  }
}
