import React from "react";

export default function preventEnterKeySubmission(
  e: React.KeyboardEvent<HTMLFormElement>,
) {
  const target = e.target as HTMLFormElement;
  if (e.key === "Enter" && !["TEXTAREA"].includes(target.tagName)) {
    console.log(`PREVENT Enter key submission!`);
    e.preventDefault();
  }
}
