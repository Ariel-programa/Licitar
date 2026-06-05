import api from "@/lib/api";

export const login = async (email: string, password: string) => {
  const { data } = await api.post("/auth/login/", { email, password });
  return data;
};

export const getMe = async () => {
  const { data } = await api.get("/auth/me/");
  return data;
};
