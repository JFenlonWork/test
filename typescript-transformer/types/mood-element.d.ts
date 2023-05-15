/**
 * Used by MooD to determine that the variable being passed is a MooD Element
 */
interface MooDElement {
  key: string;
}

/**
 * Used by MooD to determine the element inside MooD
 */
type ID = string;

/**
 * Used by MooD to pass colours to/from the visuialisation
 */
type Colour = string;

/**
 * Used by MooD to pass shapes to/from the visuialisation
 */
type Shape = string;

/**
 * Used by MooD to pass images to/from the visuialisation
 */
type Image = string;

/**
 * Used by MooD to pass dates to/from the visuialisation
 *
 * Note MooD BA delivers Date scalar type values as a string that conforms to ISO8601, e.g. '2020-06-01T12:01:02-01:00'.
 */
type MooDDate = string;

/**
 * Used by MooD to pass dates to/from the visuialisation
 *
 * Values for the "elements" type may be a single element unique id string,
 * a comma separated list of unique ids or an array of unique ids representing the element instances
 */
type Elements = string | string[];

/**
 * Used by MooD to allow any type of variable to be passed in/out
 */
type Any = boolean | number | string | MooDDate;
