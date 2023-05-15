/**
 * Simple logger class to enable logging to console only if development mode is enabled
 */
export default class Logger {
  /**
     * Controls if logging to console is ignored or not
     */
  public static developmentMode: boolean = false

  /**
     * Logs a message to the console if development mode is enabled
     * @param message The message to log to the console
     * @param args Any optional parameters to be logged
     */
  public static Log (message?: any, ...optionalParams: any[]): void {
    if (Logger.developmentMode) { console.log(message, optionalParams) }
  }

  /**
     * Logs a warning message to the console if development mode is enabled
     * @param message The message to log to the console
     * @param args Any optional parameters to be logged
     */
  public static Warn (message?: any, ...optionalParams: any[]): void {
    if (Logger.developmentMode) { console.warn(message, optionalParams) }
  }
}
