import { privateApi } from "@/lib/axios";
import {
  updateProfileRequestSchema,
  updatePasswordRequestSchema,
  type UpdateProfileRequest,
  type UpdatePasswordRequest,
} from "@/schemas/profile.schema";

export const profileService = {
  /** POST /user/profile/update — requires auth. Sent as form-data. */
  async update(payload: UpdateProfileRequest) {
    const { image, ...body } = updateProfileRequestSchema.parse(payload);
    const form = new FormData();
    Object.entries(body).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        form.append(key, String(value));
      }
    });
    if (image) form.append("image", image);
    const res = await privateApi.post("/user/profile/update", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  /** GET /user/profile/type/update — toggles buyer/seller. Requires auth. */
  async updateType() {
    const res = await privateApi.get("/user/profile/type/update");
    return res.data;
  },

  /** POST /user/profile/delete/account — permanently deletes the account. */
  async deleteAccount() {
    const res = await privateApi.post("/user/profile/delete/account");
    return res.data;
  },

  /** POST /user/profile/password/update — changes the password. Form-data. */
  async updatePassword(payload: UpdatePasswordRequest) {
    const body = updatePasswordRequestSchema.parse(payload);
    const form = new FormData();
    Object.entries(body).forEach(([key, value]) => form.append(key, String(value)));
    const res = await privateApi.post("/user/profile/password/update", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
};

export default profileService;
