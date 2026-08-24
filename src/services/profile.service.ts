import { privateApi } from "@/lib/axios";
import type { ImagePaths } from "@/services/dashboard.service";

/** Note the field names: `firstname`/`lastname`, not the `first_name` register takes. */
export interface UserInfo {
  id?: number;
  firstname?: string;
  lastname?: string;
  username?: string;
  email?: string;
  mobile_code?: string | null;
  mobile?: string | null;
  /** Relative to `image_paths`; null until the user uploads one. */
  image?: string | null;
  kyc_verified?: number;
  /**
   * The verification gates, when this endpoint carries them — some builds return
   * them here as well as on the dashboard. Optional on purpose: `accountGate`
   * ignores a flag that is absent rather than reading it as a zero.
   */
  email_verified?: number;
  two_factor_status?: number;
  two_factor_verified?: number;
  date_of_birth?: string | null;
  country?: string;
  city?: string;
  state?: string;
  zip?: string;
  address?: string;
}

export interface ProfileData {
  user_info?: UserInfo;
  image_paths?: ImagePaths;
}

/**
 * The editable half of `user_info`.
 *
 * `email` and `username` are absent because the endpoint does not take them — they
 * are the account's identity, changed through support rather than a form. Only
 * `firstname` and `lastname` are required by the validator; the rest may be sent
 * empty to clear what was there.
 */
export interface ProfileUpdateRequest {
  firstname: string;
  lastname: string;
  /**
   * The dial code, bare digits. Not in the documented request body — the collection
   * only sends `mobile` — but it is a real column (`GET .../info` returns it) and a
   * number without its code is ambiguous, so it goes out alongside. A backend that
   * does not validate it simply ignores it.
   */
  mobile_code?: string;
  mobile?: string;
  country?: string;
  state?: string;
  city?: string;
  zip?: string;
  address?: string;
  /** Only when the user picked a new avatar — omitted keeps the current one. */
  image?: File | null;
}

export interface PasswordUpdateRequest {
  current_password: string;
  password: string;
  password_confirmation: string;
}

export const profileService = {
  /** GET /user/profile/info — who is signed in. */
  async get(): Promise<{ data?: ProfileData }> {
    const res = await privateApi.get("/user/profile/info");
    return res.data;
  },

  /**
   * POST /user/profile/info/update — multipart, since the avatar rides along with
   * the text fields.
   *
   * Every text field goes out even when blank, unlike the KYC submission: this
   * endpoint replaces the record it is given, so omitting a cleared field would
   * quietly keep the old value instead of clearing it. Only `image` is skipped
   * when unset, because "no new file" means "keep the current avatar".
   */
  async update(values: ProfileUpdateRequest) {
    const { image, ...text } = values;
    const form = new FormData();
    for (const [name, value] of Object.entries(text)) form.append(name, value ?? "");
    if (image) form.append("image", image);

    const res = await privateApi.post("/user/profile/info/update", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  /** POST /user/profile/password/update — the current password is the proof. */
  async updatePassword(values: PasswordUpdateRequest) {
    const form = new FormData();
    for (const [name, value] of Object.entries(values)) form.append(name, value);

    const res = await privateApi.post("/user/profile/password/update", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
};

export default profileService;
