import Exception from './Exception';
import {NodeImpl} from 'xmldom-ts';

export default class InvalidPatchDirective extends Exception {
  protected tag: string = 'invalid-patch-directive';

  constructor(action?: NodeImpl) {
    super(Exception.ErrDirective, action);
  }
}
