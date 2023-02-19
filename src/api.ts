import { check } from "./checker";
import { parse } from "./parser";
import { Format, render } from "./renderer";

export const run = (input: string, format: Format): string => {
  return render(check(parse(input)), format);
};
