import React from "react";
import { createRoot } from "react-dom/client";
import Logger from "@helpers/logger";
import "./visualization.css";

//
//    Entry function declaration
//
export function visualization(
  config: MooDConfig<
    Vis.Data.Root,
    Vis.Style.Root,
    Vis.Actions.Root,
    Vis.Inputs.Root,
    Vis.Outputs.Root
  >
) {
  Logger.developmentMode = config?.style.DevelopmentMode;
  Logger.Log("Development mode is enabled, logging will be enabled");

  /** The visualization state is stored in a string format
   * This visualization expects that string to be in a JSON format
   */
  let state: Vis.State.Root | null = null;
  if (config?.state != null) {
    try {
      state =
        config?.state?.value != "" ? JSON.parse(config?.state?.value) : {};
    } catch (e) {
      throw new Error(`${e}
            Custom Visualisation State is not set up correctly, please ensure that the state is a valid JSON string`);
    }
  }

  const width = parseFloat(config.width);
  const height = parseFloat(config.height);
  const animation = config.animation;

  const app = <div>An example div</div>;

  Logger.Log("This is an example of a development log");

  const root = createRoot(document.getElementById(config.element));
  root.render(app);
}
