import { toast } from "react-toastify";

const useToast = () => {
  const success = (message) => {
    toast.success(message, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
    });
  };

  const error = (message) => {
    toast.error(message, {
      position: "top-right",
      autoClose: 4000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
    });
  };

  const info = (message) => {
    toast.info(message, {
      position: "top-right",
      autoClose: 3000,
    });
  };

  const warning = (message) => {
    toast.warning(message, {
      position: "top-right",
      autoClose: 3500,
    });
  };

  return { success, error, info, warning };
};

export default useToast;