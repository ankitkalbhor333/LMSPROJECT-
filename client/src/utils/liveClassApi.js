import API from "./api";

export const getUpcomingLiveClasses = () => API.get("/live-classes/upcoming");
export const getLiveClasses = () => API.get("/live-classes");
export const getLiveClassById = (id) => API.get(`/live-classes/${id}`);
export const createLiveClass = (payload) => API.post("/live-classes", payload);
export const updateLiveClass = (id, payload) => API.put(`/live-classes/${id}`, payload);
export const deleteLiveClass = (id) => API.delete(`/live-classes/${id}`);
export const startLiveClass = (id) => API.post(`/live-classes/${id}/start`);
export const endLiveClass = (id) => API.post(`/live-classes/${id}/end`);
export const joinLiveClass = (id) => API.post(`/live-classes/${id}/join`);
export const leaveLiveClass = (id) => API.post(`/live-classes/${id}/leave`);
export const getLiveClassToken = (id) => API.post(`/live-classes/${id}/token`);
export const getLiveClassAttendance = (id) => API.get(`/live-classes/${id}/attendance`);
export const getLiveClassAttendanceSummary = (id) => API.get(`/live-classes/${id}/attendance-summary`);
export const getLiveClassRecording = (id) => API.get(`/live-classes/${id}/recording`);
export const toggleLiveClassRecording = (id, payload) => API.post(`/live-classes/${id}/recording`, payload);
