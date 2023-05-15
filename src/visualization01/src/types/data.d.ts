declare namespace Vis.Data {
  interface Root {
    ExampleVariable1: string,
    ExampleVariable2: boolean,
    ExampleVariable3: Array<Query>,
  }
  
  interface Query extends MooDElement {
    key: ID,
    Name: string,
    Value: Any,
  }
}