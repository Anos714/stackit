import yoctoSpinner from "yocto-spinner";

/** Thin wrapper so the rest of the codebase imports from one place. */
export function spinner(opts: { text: string }) {
  return yoctoSpinner(opts);
}

export { yoctoSpinner };
