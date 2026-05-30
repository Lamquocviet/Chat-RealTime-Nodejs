import api from "@/lib/axios";

export const userService = {
  uploadAvatar: async (formData: FormData) => {
    const res = await api.post("/users/uploadAvatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (res.status === 400) {
      throw new Error(res.data.message);
    }

    return res.data; 
  },
  updateProfile: async (data: { displayName?: string; email?: string; phone?: string; bio?: string }) => {

      console.log("Calling PATCH API");

    const res = await api.patch("/users/updateProfile", data);
    console.log(res);
    return res.data;
  }
};
