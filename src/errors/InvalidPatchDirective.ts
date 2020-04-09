import Exception from './Exception';
import {NodeImpl} from 'xmldom-ts';

/**
 * A patch directive could not be fulfilled because the given directives were
 * not understood.
 */
export default class InvalidPatchDirective extends Exception {
  protected tag: string = 'invalid-patch-directive';

  constructor(action?: NodeImpl) {
    super(Exception.ErrDirective, action);
  }
}
