import toast from "react-hot-toast";

export const copyText = async (text: string, message: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(message);
  } catch (error) {
    console.log(error);
    toast.error("Something went wrong");
  }
};
