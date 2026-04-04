import { CONSTANTS } from "./constants";

export const updateGoogleSheet = async (data, command) => {
  try {
    const response = await fetch(CONSTANTS.SHEETS, {
      method: "POST",
      redirect: "follow",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify({ command, ...data }),
    });

    const text = await response.text();
    console.log(text);
    const hasError = text.trim().split(" ")[0] === "Error:";

    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`);
    }

    if (hasError) {
      throw new Error(text);
    }
    return [true, ""];
  } catch (e) {
    console.error(e.message);
    return [false, e.message];
  }
};
