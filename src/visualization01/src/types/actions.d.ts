import { ActionType } from './action-type';

declare global {
  namespace Vis.Actions {
    interface Root {
      [ActionType.Example_Click]: MooDAction,
    }
  }
}