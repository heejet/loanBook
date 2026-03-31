import { CONSTANTS } from "./constants";

export const saveToLocal = (key, value) => {
  localStorage.setItem(key, value);
};

export const getFromLocal = (key) => {
  return localStorage.getItem(key);
};

export const checkIfActivityHasStarted = () => {
  let isRankNameExist =
    getFromLocal(CONSTANTS.FORM_ITEM_KEYS.RANK_NAME) !== null;
  let isPlatoonSectionExist =
    getFromLocal(CONSTANTS.FORM_ITEM_KEYS.PLATOON_SECTION) != null;
  let isLocationExist =
    getFromLocal(CONSTANTS.FORM_ITEM_KEYS.LOCATION) !== null;
  let isActivityExist =
    getFromLocal(CONSTANTS.FORM_ITEM_KEYS.ACTIVITY) !== null;
  let isStartTimeExist =
    getFromLocal(CONSTANTS.FORM_ITEM_KEYS.START_TIME) !== null;
  // console.log(
  //   isRankNameExist,
  //   isPlatoonSectionExist,
  //   isLocationExist,
  //   isActivityExist,
  //   isStartTimeExist
  // );
  let isActivityStarted =
    isRankNameExist &&
    isPlatoonSectionExist &&
    isLocationExist &&
    isActivityExist &&
    isStartTimeExist;
  return isActivityStarted;
};

export const removeFromLocal = (key) => {
  localStorage.removeItem(key);
};

export const sendStartTelegramMessage = async () => {
  const rankName = getFromLocal(
    CONSTANTS.FORM_ITEM_KEYS.RANK_NAME
  ).toUpperCase();
  const platoonSection = getFromLocal(CONSTANTS.FORM_ITEM_KEYS.PLATOON_SECTION);
  const location = getFromLocal(
    CONSTANTS.FORM_ITEM_KEYS.LOCATION
  ).toUpperCase();
  const activity = getFromLocal(CONSTANTS.FORM_ITEM_KEYS.ACTIVITY);
  const subUnit = getFromLocal(CONSTANTS.FORM_ITEM_KEYS.SUB_UNIT);
  const startTime = getFromLocal(CONSTANTS.FORM_ITEM_KEYS.START_TIME);
  const message = `Rank/Name: ${rankName}\nSub-Unit: ${subUnit}\n${
    subUnit === CONSTANTS.COYS.HQ ? "Branch/ Department:" : "Plt/Section:"
  } ${platoonSection}\nLocation: ${location}\nActivity: ${activity}\nStart: ${startTime}\nEnd:`;

  const testUrl = `https://api.telegram.org/bot7677613806:AAHuIpblzFnJcUYKisgYITWskDj9jhtXPXI/sendMessage`;

  await fetch(testUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: CONSTANTS.CHANNELS[subUnit],
      text: message,
    }),
  });
};

export const sendEndTelegramMessage = async () => {
  const rankName = getFromLocal(CONSTANTS.FORM_ITEM_KEYS.RANK_NAME);
  const platoonSection = getFromLocal(CONSTANTS.FORM_ITEM_KEYS.PLATOON_SECTION);
  const location = getFromLocal(CONSTANTS.FORM_ITEM_KEYS.LOCATION);
  const activity = getFromLocal(CONSTANTS.FORM_ITEM_KEYS.ACTIVITY);
  const subUnit = getFromLocal(CONSTANTS.FORM_ITEM_KEYS.SUB_UNIT);
  const startTime = getFromLocal(CONSTANTS.FORM_ITEM_KEYS.START_TIME);
  const endTime = getFromLocal(CONSTANTS.FORM_ITEM_KEYS.END_TIME);
  const message = `Rank/Name: ${rankName}\nSub-Unit: ${subUnit}\n${
    subUnit === CONSTANTS.COYS.HQ ? "Branch/ Department:" : "Plt/Section:"
  } ${platoonSection}\nLocation: ${location}\nActivity: ${activity}\nStart: ${startTime}\nEnd: ${endTime}`;

  const testUrl = `https://api.telegram.org/bot7677613806:AAHuIpblzFnJcUYKisgYITWskDj9jhtXPXI/sendMessage`;

  await fetch(testUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: CONSTANTS.CHANNELS[subUnit],
      text: message,
    }),
  });
};
