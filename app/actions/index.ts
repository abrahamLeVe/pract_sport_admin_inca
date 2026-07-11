import { loginAction, registerUserAction } from "./auth";
import {
  createBannerAction,
  deleteBannerAction,
  toggleBannerStatusAction,
  updateBannerAction,
} from "./banners/crud";
import {
  createBrandAction,
  deleteBrandAction,
  toggleBrandStatusAction,
  updateBrandAction,
} from "./brands/crud";
import {
  createCategoryAction,
  deleteCategoryAction,
  toggleCategoryStatusAction,
  updateCategoryAction,
} from "./categories/crud";

import {
  createEventAction,
  deleteEventAction,
  toggleEventStatusAction,
  updateEventAction,
} from "./events/crud";
import { updateOrderStatusAction } from "./orders";
import {
  createProductAction,
  deleteProductAction,
  toggleProductStatusAction,
  updateProductAction,
} from "./products/crud";

import { updateProfileAction } from "./profile";
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
  profile: {
    updateProfileAction,
  },
};
