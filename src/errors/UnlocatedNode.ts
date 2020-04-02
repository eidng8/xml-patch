import Exception from './Exception';

export default class UnlocatedNode extends Exception {
  protected tag: string = 'unlocated-node';
}
