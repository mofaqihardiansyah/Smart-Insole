import { useLocation, useNavigate } from "react-router-dom";

/**
 * useRoute: Hook kustom untuk mendapatkan informasi rute aktif.
 - Mengembalikan location.pathname, params, dan fungsi navigate
 - Digunakan di App.jsx untuk mengetahui link aktif di the app shell navigation
 */
export const useRoute = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return {
    pathname: location.pathname,
    search: location.search,
    hash: location.hash,
    navigate,
  };
};