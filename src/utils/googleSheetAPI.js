import { CONSTANTS } from "./constants";
import { getFromLocal } from "./telegramSender";

export const getSFTChecklist = async (url) => {
  url += `?action=GET_SFT_CHECKLIST`;
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

export const getRowNumber = async (coy) => {
  const url = `${CONSTANTS.SHEETS}?action=GET_LAST_ROW&coy=${coy}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data = await response.json();
    console.log("Data:", data.data);

    return data.data;
  } catch (error) {
    console.error("Fetch error:", error);
  }
};

export const updateSFT = async (row) => {
  const data = {
    rankName: getFromLocal(CONSTANTS.FORM_ITEM_KEYS.RANK_NAME),
    startTime: getFromLocal(CONSTANTS.FORM_ITEM_KEYS.START_TIME),
    endTime: getFromLocal(CONSTANTS.FORM_ITEM_KEYS.END_TIME),
    platoonSection: getFromLocal(CONSTANTS.FORM_ITEM_KEYS.PLATOON_SECTION),
    location: getFromLocal(CONSTANTS.FORM_ITEM_KEYS.LOCATION),
    activity: getFromLocal(CONSTANTS.FORM_ITEM_KEYS.ACTIVITY),
    rowNumber: row,
    subUnit: getFromLocal(CONSTANTS.FORM_ITEM_KEYS.SUB_UNIT),
  };

  try {
    const response = await fetch(CONSTANTS.SHEETS, {
      method: "POST",
      redirect: "follow",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(data),
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
