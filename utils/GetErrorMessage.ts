export function GetErrorMessage(message: string) {
  switch (message) {
    case "Expected number, received nan":
      return "Please enter a number";
    default:
      return message;
  }
}
