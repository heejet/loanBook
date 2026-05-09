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
    return [true, text];
  } catch (e) {
    console.error(e.message);
    return [false, e.message];
  }
};

export const getList = async (url) => {
  url += `?action=GET_CHECKLIST`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data = await response.json();
    // console.log("Data:", data.data);

    return data.data;
  } catch (error) {
    console.error("Fetch error:", error);
  }
};
