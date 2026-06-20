import { loginAction, registerUserAction } from "./auth";
import {
  createBannerAction,
  deleteBannerAction,
  toggleBannerStatusAction,
  updateBannerAction,
} from "./banners";
import {
  createBrandAction,
  deleteBrandAction,
  toggleBrandStatusAction,
  updateBrandAction,
} from "./brands";
import {
  createCategoryAction,
  deleteCategoryAction,
  toggleCategoryStatusAction,
  updateCategoryAction,
} from "./categories";
import {
  createEventAction,
  deleteEventAction,
  toggleEventStatusAction,
  updateEventAction,
} from "./events";
import { updateOrderStatusAction } from "./orders";
import {
  createProductAction,
  deleteProductAction,
  toggleProductStatusAction,
  updateProductAction,
} from "./products";
import { updateRegistrationStatusAction } from "./registrations";
import { updateClubSettingsAction } from "./settings";
import { getPrivateVideoUrlAction, uploadFileToS3Action } from "./storage";
import { updateUserAction } from "./users";

export const actions = {
  auth: {
    registerUserAction,
    loginAction,
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
  brands: {
    createBrandAction,
    updateBrandAction,
    deleteBrandAction,
    toggleBrandStatusAction,
  },
  products: {
    createProductAction,
    updateProductAction,
    deleteProductAction,
    toggleProductStatusAction,
  },
  settings: {
    updateClubSettingsAction,
  },
  events: {
    createEventAction,
    updateEventAction,
    deleteEventAction,
    toggleEventStatusAction,
  },
  orders: {
    updateOrderStatusAction,
  },
  registrations: {
    updateRegistrationStatusAction,
  },
};
