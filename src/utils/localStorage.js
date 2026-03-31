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
