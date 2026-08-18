import { debounce } from "custom-card-helpers";
import { version } from "../package.json";

// Log Version
console.groupCollapsed(`%c⚡ Power Flow Card Plus Mushroom v${version} is installed`, "color: #488fc2; font-weight: bold");
console.log("Readme:", "https://github.com/sphings79/power-flow-card-plus-mushroom");
console.groupEnd();

export const logError = debounce((error: string) => {
  console.log(`%c⚡ Power Flow Card Plus Mushroom v${version} %cError: ${error}`, "color: #488fc2; font-weight: bold", "color: #b33a3a; font-weight: normal");
}, 60000);
