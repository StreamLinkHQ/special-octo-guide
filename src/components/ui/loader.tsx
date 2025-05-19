import Modal from "./modal";

const Loading = () => {
  return (
    <Modal bgColor="bg-modal-black">
      <div className="flex justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-primary" />
      </div>
    </Modal>
  );
};

export default Loading;
