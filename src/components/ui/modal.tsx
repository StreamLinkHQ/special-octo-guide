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

export default Modal;
