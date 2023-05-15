const JsonToTS = require("json-to-ts");
const glob = require("glob");
const path = require("path");
const fs = require("fs");
const indenting = "  ";

/**
 * Compile all config.json.ejs into an automatically generated typescript type file
 */
glob("src/**/no-guid.visualization.config.json.ejs", function (er, files) {
  files.forEach(function (file) {
    //Swap file out for visualization.config.json.ejs if it exists as that is most up to date for config
    if (fs.existsSync(file.replace("no-guid.", "")))
      file = file.replace("no-guid.", "");

    //Parse the config.json.ejs file into JSON
    
    let jsonResult;
    try {
      jsonResult = JSON.parse(
        fs
          .readFileSync(path.join(__dirname, "../", file))
          .toString()
          //Remove any webpack version plugin functions as it breaks JSON parsing
          .replace(/(<%= package.version %>)|(<%= uuid.v4(); %>)/gi, "0")
      );
    } catch (e) {
      throw new Error(`Unable to parse JSON file: ${file}, please check that it is valid JSON. \n${e}`);
    }

    //Parse all of the required config values
    let styleConfig = parseToNamespace(
      parseStyle(jsonResult?.style?.JSON),
      "Style",
      true
    );

    //Parse the JSON actions into TS and make the initial type statically named
    let actionsParsed = parseActions(jsonResult?.actions);
    let actionsConfig = parseToGlobal(
      parseToNamespace(actionsParsed[0], "Actions", true)
    );
    actionsConfig = ["import { ActionType } from './action-type';", ""].concat(
      actionsConfig
    );

    //Parse the JSON inputs into TS and make the initial type statically named
    let ioConfig = parseIO(jsonResult?.inputs, jsonResult?.outputs);
    let inputConfig = parseToNamespace(ioConfig[0], "Inputs", true);
    let outputConfig = parseToNamespace(ioConfig[1], "Outputs", true);

    //Parse the JSON state into TS and make the initial type statically named
    let stateConfig = parseToNamespace(
      parseState(jsonResult?.state),
      "State",
      true
    );

    writeTypesToFiles(
      path.dirname(file),
      styleConfig,
      actionsConfig,
      actionsParsed[1],
      inputConfig,
      outputConfig,
      stateConfig
    );
  });
});

/**
 * Write all of the parsed values to file
 * @param {string[]} styleConfig The parsed style
 * @param {string[]} actionsConfig The parsed actions
 * @param {string[]} inputsConfig The parsed inputs
 * @param {string[]} outputsConfig The parse outputs
 * @param {string[]} stateConfig The parse state
 */
function writeTypesToFiles(
  visDir,
  styleConfig,
  actionsConfig,
  actionsEnum,
  inputsConfig,
  outputsConfig,
  stateConfig
) {
  //Ensure that the folder structure is set up correctly
  if (!fs.existsSync(path.join(visDir, "src/types"))) {
    fs.mkdirSync(path.join(visDir, "src/types"), {
      recursive: true,
    });
  }

  //Write all of the translated files to the types folder
  fs.writeFileSync(
    path.join(visDir, "src/types", "style.d.ts"),
    styleConfig.join("\n")
  );

  fs.writeFileSync(
    path.join(visDir, "src/types", "actions.d.ts"),
    actionsConfig.join("\n")
  );

  fs.writeFileSync(
    path.join(visDir, "src/types", "action-type.ts"),
    actionsEnum.join("\n")
  );

  fs.writeFileSync(
    path.join(visDir, "src/types", "inputs.d.ts"),
    inputsConfig.join("\n")
  );

  fs.writeFileSync(
    path.join(visDir, "src/types", "outputs.d.ts"),
    outputsConfig.join("\n")
  );

  fs.writeFileSync(
    path.join(visDir, "src/types", "state.d.ts"),
    stateConfig.join("\n")
  );
}

/**
 * Parse any converted TypeScript into a global scope
 * @param {string[]} parsedInput The parsed TypeScript that needs to be converted to a namespace
 */
function parseToGlobal(parsedInput) {
  let ret = ["declare global {"];
  if (parsedInput == null) return ret.concat("}");

  //Split any parsedInputs that arent in an array format
  parsedInput = parsedInput.map((line) => {
    let lineSplit = line.split("\n");
    if (lineSplit.length == 1) return lineSplit[0];
    return lineSplit;
  });

  //Add an indent to every line to make it inline with global addition and remove any declares
  ret = ret.concat(indentTS(parsedInput, true));

  ret.push("}");
  return ret;
}

/**
 * Parse any converted TypeScript into a custom namespace for the visualization
 * @param {string[]} parsedInput The parsed TypeScript that needs to be converted to a namespace
 * @param {string} namespace The namespace to add to the parsed input
 * @param {boolean} modifyRoot Controls if the root element name is changed to root
 */
function parseToNamespace(parsedInput, namespace, modifyRoot) {
  let ret = [
    `declare namespace Vis${namespace == "" ? "" : "." + namespace} {`,
  ];
  if (parsedInput == null) return ret.concat("}");

  //Split any parsedInputs that arent in an array format
  parsedInput = parsedInput.map((line) => {
    let lineSplit = line.split("\n");
    if (lineSplit.length == 1) return lineSplit[0];
    return lineSplit;
  });

  //Rename the first interface to Root to make namespace naming scheme better
  if (modifyRoot == true) {
    if (Array.isArray(parsedInput[0])) {
      parsedInput[0][0] =
        parsedInput[0].length > 1 ? "interface Root {" : "interface Root {}";
    } else {
      parsedInput[0] =
        parsedInput.length > 1 ? "interface Root {" : "interface Root {}";
    }
  }

  //Add an indent to every line to make it inline with namespace addition and remove any declares
  ret = ret.concat(indentTS(parsedInput, true));

  ret.push("}");
  return ret;
}

/**
 * Adds an indent to the begining of all the lines of a parsed TypeScript
 * @param {string[]} parsedTypeScript The parsed TypeScript that needs to be indented
 * @param {boolean} removeDeclare Controls if any declares should be removed from the indent lines
 * @returns
 */
function indentTS(parsedTypeScript, removeDeclare) {
  return parsedTypeScript.map((line, index) => {
    //If line is an array then it's actually a JSON to TS string
    if (Array.isArray(line)) {
      return (
        line
          .map((subLine) => {
            return (
              indenting +
              (removeDeclare == true
                ? subLine
                : subLine.replace(/(?<=^\s*)declare /gi, ""))
            );
          })
          .join("\n") + (index == parsedTypeScript.length - 1 ? "" : "\n")
      );
    }

    if (line == "") {
      return "";
    } else {
      return (
        indenting +
        (line == true ? line : line.replace(/(?<=^\s*)declare /gi, ""))
      );
    }
  });
}

/**
 * Parse the style out of a JSON file into TS
 * @param {JSON} styleJSON The JSON to convert into TS
 */
function parseStyle(styleJSON) {
  if (styleJSON == null) return ["interface Style {}"];
  try {
    //Try to parse the json style into TS if available
    let styleConfig = JsonToTS(styleJSON);
    if (styleConfig.length > 0) {
      //Format the style onto one line if it is empty
      if (styleConfig[0] == "interface RootObject {\n}") {
        return ["interface Style {}"];
      } else {
        styleConfig[0] = styleConfig[0].replace("RootObject", "Style");
      }
      return styleConfig;
    } else {
      return ["interface Style {}"];
    }
  } catch {
    //Catch any errors with the styling not existing or being incorrectly formatted
    return ["interface Style {}"];
  }
}

/**
 * Parse the action out of a JSON file into TS
 * @param {JSON} actionsJSON The JSON to convert into TS
 */
function parseActions(actionsJSON) {
  let actionsEnum = [];
  if (actionsJSON != null) {
    actionsEnum = Object.keys(actionsJSON).map((action) => {
      return action.replace(/[^a-zA-Z0-9]/g, "_").replace(/_(?=_+| )/g, "");
    });
  }

  let actionsConfig = [];
  if (actionsJSON != null) {
    actionsConfig = Object.keys(actionsJSON).map((action, index) => {
      return `${indenting}[ActionType.${actionsEnum[index]}]: MooDAction,`;
    });
  }

  //Parse a default value if actions does exist
  if (actionsJSON == null || actionsConfig.length == 0) {
    return [["interface Actions {}"], ["export enum ActionType {}"]];
  }

  return [
    ["interface Actions {"].concat(actionsConfig, "}"),
    ["export enum ActionType {"].concat(
      Object.keys(actionsJSON).map((action, index) => {
        return `${indenting}${actionsEnum[index]} = "${action}",`;
      }),
      "}"
    ),
  ];
}

/**
 * Parse the inputs and outputs out of a JSON file into TS
 * @param {JSON} inputJSON The input JSON to convert into TS
 * @param {JSON} outputJSON  The output JSON to convert into TS
 */
function parseIO(inputJSON, outputJSON) {
  let returnConfigs = [[], []];

  //Parse the JSON inputs into TS and make the initial type statically named
  if (inputJSON != null && inputJSON.length > 0) {
    //Inputs conversion is more complex so extracted to own function
    returnConfigs[0] = ["interface Inputs {"].concat(
      handleIOConversion(inputJSON),
      "}"
    );
  } else {
    returnConfigs[0] = ["interface Inputs {}"];
  }

  //Parse the JSON outputs into TS and make the initial type statically named
  if (outputJSON != null && outputJSON.length > 0) {
    //Outputs conversion is more complex so extracted to own function
    returnConfigs[1] = ["interface Outputs {"].concat(
      handleIOConversion(outputJSON),
      "}"
    );
  } else {
    returnConfigs[1] = ["interface Outputs {}"];
  }

  return returnConfigs;
}

/**
 * Parse the state out of a JSON file into TS
 * @param {JSON} stateJSON The JSON to convert into TS
 */
function parseState(stateJSON) {
  if (stateJSON == null) return ["interface State {}"];

  try {
    //Try to parse the json state into TS if available
    let stateConfig = JsonToTS(stateJSON);
    if (stateConfig.length > 0) {
      //Format the state onto one line if it is empty
      if (stateConfig[0] == "interface RootObject {\n}") {
        return ["interface State {}"];
      } else {
        stateConfig[0] = stateConfig[0].replace("RootObject", "State");
      }
      return stateConfig;
    } else {
      return ["interface State {}"];
    }
  } catch {
    //Catch any errors with the styling not existing or being incorrectly formatted
    return ["interface State {}"];
  }
}

/**
 * Convert MooD Inputs/Outputs into the TypeScript response
 * @param {{name: string, displayName: string, type: Any, default: Any}[]} values
 */
function handleIOConversion(values) {
  //Loop through every input value and convert it
  return values.map((value, index) => {
    //TypeScript types in Schema specifically require a Capital at the start so convert all types to TypeScript Scehma types
    let valueType =
      value.type.charAt(0).toUpperCase() +
      value.type.toLowerCase().substring(1);

    //MooD accepts Date but JS has it's own Date type so TypeScript Schema is slightly modified
    return `${indenting}${value.name}?: ${valueType.replace(
      "Date",
      "MooDDate"
    )}${index == values.length - 1 ? "" : ","}`;
  });
}