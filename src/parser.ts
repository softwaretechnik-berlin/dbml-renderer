import { parse as dbmlParse } from "./dbml";
import { Output } from "./types";

export const parse = (input: string): Output => {
  return Output.parse(dbmlParse(input));
};
