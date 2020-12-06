import axios from "axios";

// here we are just maing our code look more DRY. With every backend call we must deal with errors and success states. The idea of creating these kinds of services is to make our lives easier in the components
function internalServerError(err) {
  console.log("err:", err.response.data);
  if (err.response.data.errorMessage) {
    return {
      status: false,
      errorMessage: err.response.data.errorMessage,
    };
  }
  return {
    status: false,
    errorMessage: "Internal server error. Please check your server",
  };
}

function successStatus(res) {
  return {
    status: true,
    data: res.data,
  };
}

const authService = axios.create({
  baseURL: `${process.env.REACT_APP_SERVER_URL}/auth`,
});

export function login(credentials) {
  return authService
    .post("/login", credentials)
    .then(successStatus)
    .catch(internalServerError);
}

export function getLoggedIn(accessToken) {
  return authService
    .get(`session/${accessToken}`)
    .then(successStatus)
    .catch(internalServerError);
}

export function signup(credentials) {
  return authService
    .post("/signup", credentials)
    .then(successStatus)
    .catch(internalServerError);
}

export function logout() {
  return authService
    .delete("/delete", { accessToken })
    .then(successStatus)
    .catch(internalServerError);
}
