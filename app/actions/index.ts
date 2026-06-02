import { registerUserAction } from "./auth";
import { updateUserAction } from "./users";

export const actions = {
  auth: {
    registerUserAction,
  },
  users: {
    updateUserAction,
  },
};
