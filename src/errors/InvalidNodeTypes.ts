import Exception from './Exception';

export default class InvalidNodeTypes extends Exception {
  protected tag: string = 'invalid-node-types';
}
