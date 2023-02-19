import { parse } from "./parser";
import { Format, render } from "./renderer";
import { verify } from "./verifier";

export const run = (input: string, format: Format): string => {
  return render(verify(parse(input)), format);
};
