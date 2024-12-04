import React from "react";

/**
 * Prevents form submission when the Enter key is pressed, except for textarea and button elements.
 * This function is useful for handling keyboard events in forms to avoid unintended submissions.
 *
 * @param e - The React keyboard event object from the form element.
 * @returns void
 *
 * @example
 * <form onKeyDown={preventEnterKeySubmission}>
 *   // Form content
 * </form>
 */
export default function preventEnterKeySubmission(
  e: React.KeyboardEvent<HTMLFormElement>,
) {
  const target = e.target as HTMLFormElement;
  const isTextarea = target.tagName === "TEXTAREA";
  const isButton = target.tagName === "BUTTON";

  if (e.key === "Enter" && !(isTextarea || isButton)) {
    console.log(`PREVENT Enter key submission!`);
    e.preventDefault();
  }
}
