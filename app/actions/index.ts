import { registerUserAction } from "./auth";
import {
  createBannerAction,
  deleteBannerAction,
  toggleBannerStatusAction,
  updateBannerAction,
} from "./banners";
import {
  createCategoryAction,
  deleteCategoryAction,
  toggleCategoryStatusAction,
  updateCategoryAction,
} from "./categories";
import { getPrivateVideoUrlAction, uploadFileToS3Action } from "./storage";
import { updateUserAction } from "./users";

export const actions = {
  auth: {
    registerUserAction,
  },
  users: {
    updateUserAction,
  },
  storage: {
    uploadFileToS3Action,
    getPrivateVideoUrlAction,
  },
  banners: {
    createBannerAction,
    updateBannerAction,
    deleteBannerAction,
    toggleBannerStatusAction,
  },
  categories: {
    createCategoryAction,
    updateCategoryAction,
    deleteCategoryAction,
    toggleCategoryStatusAction,
  },
};
