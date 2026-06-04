import { registerUserAction } from "./auth";
import {
  createBannerAction,
  deleteBannerAction,
  toggleBannerStatusAction,
  updateBannerAction,
} from "./banners";
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
};
