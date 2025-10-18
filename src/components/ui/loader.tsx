
type ModalProps = {
  children: React.ReactNode;
  bgColor: string;
};

const Modal = ({ children, bgColor }: ModalProps) => {
  return (
    <div className={`z-[20] w-full h-full ${bgColor} fixed top-0 left-0`}>
      <div className="flex flex-col items-center justify-center h-full">
        {children}
      </div>
    </div>
  );
};

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
