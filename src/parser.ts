import { parse as dbmlParse } from "./dbml";
import { Output } from "./types";
import { ZodError } from "zod";

export const parse = (input: string): Output => {
  try {
    return Output.parse(dbmlParse(input));
  } catch (e) {
    throw new SyntaxError(e as PeggyError);
  }
};

type PeggyError = Error & {
  found: string;
  location: {
    start: SourceLocation;
    end: SourceLocation;
  };
};

type SourceLocation = {
  offset: number;
  line: number;
  column: number;
};

class SyntaxError extends Error {
  constructor(peggyErr: PeggyError | ZodError) {
    if (peggyErr instanceof ZodError) {
      console.debug(peggyErr);
      super("Zod Error");
    } else {
      super(
        `Could not parse input at line ${peggyErr.location.start.line}:${peggyErr.location.start.column}. ${peggyErr.message}`,
      );
    }
    this.name = "SyntaxError";
  }
}
