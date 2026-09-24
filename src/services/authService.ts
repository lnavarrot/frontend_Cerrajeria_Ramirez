import { backendApi, tokenStorage } from '@/adapters/backendApi';
export type User = { id: string; firstName: string; lastName: string; email: string; phone?: string; role: string };
export type AuthResponse = { accessToken: string; refreshToken: string; user: User };
const USER_KEY='currentUser';
export const userStorage={ get():User|null{try{return JSON.parse(localStorage.getItem(USER_KEY)||'null')}catch{return null}}, set(user:User){localStorage.setItem(USER_KEY,JSON.stringify(user))}, clear(){localStorage.removeItem(USER_KEY)} };
export const authService = {
  async login(email:string,password:string){const {data}=await backendApi.post<AuthResponse>('/auth/login',{email,password});tokenStorage.set(data.accessToken,data.refreshToken);userStorage.set(data.user);return data;},
  async register(payload:{firstName:string;lastName:string;email:string;phone:string;password:string}){const {data}=await backendApi.post<AuthResponse>('/auth/register',payload);tokenStorage.set(data.accessToken,data.refreshToken);userStorage.set(data.user);return data;},
  async logout(){const refreshToken=tokenStorage.refreshToken;try{if(refreshToken)await backendApi.post('/auth/logout',{refreshToken});}finally{tokenStorage.clear();userStorage.clear();}}
};
