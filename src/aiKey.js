const K = "lexcontrol_ant_key";
export const getAntKey = () => { try { return localStorage.getItem(K) || ""; } catch { return ""; } };
export const setAntKey = v => { try { v ? localStorage.setItem(K, v) : localStorage.removeItem(K); } catch {} };
