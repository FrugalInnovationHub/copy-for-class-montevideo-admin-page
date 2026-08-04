import http from "../http-common";

const getAll = (page) => {
  return http.get(`/${page}`);
};

const get = (id, page) => {
  console.log(`/${page}${id}/`)
  return http.get(`/${page}${id}/`);
};

const create = (data, page) => {
  return http.post(`/${page}`, data);
};

const update = (id, data, page) => {
  return http.patch(`${page}${id}/`, data);
};

const remove = (id, page) => {
  return http.delete(`${page}${id}/`);
};

const removeAll = (page) => {
  return http.delete(`${page}`);
};

const findByTitle = (title, page) => {
  return http.get(`/${page}?title=${title}`);
};

const userServices = {
  getAll,
  get,
  create,
  update,
  remove,
  removeAll,
  findByTitle,
};

export default userServices;