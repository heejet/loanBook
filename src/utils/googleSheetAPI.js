import { CONSTANTS } from "./constants";
import { getFromLocal } from "./localStorage";

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

    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`);
    }
    return true;
  } catch (e) {
    console.error("Failed to update SFT:", e.message);
    return false;
  }
};
