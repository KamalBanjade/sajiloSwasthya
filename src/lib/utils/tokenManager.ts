import Cookies from 'js-cookie';

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export const getToken = () => {
  return Cookies.get(TOKEN_KEY);
};

export const setToken = (token: string, expiresIn: number = 60) => {
  // Expires in days, convert minutes to days for js-cookie
  Cookies.set(TOKEN_KEY, token, { expires: expiresIn / (24 * 60), secure: process.env.NODE_ENV === 'production' });
};

export const removeToken = () => {
  Cookies.remove(TOKEN_KEY);
  Cookies.remove(REFRESH_TOKEN_KEY);
};

export const setRefreshToken = (token: string, expiresDays: number = 7) => {
  Cookies.set(REFRESH_TOKEN_KEY, token, { expires: expiresDays, secure: process.env.NODE_ENV === 'production' });
};
