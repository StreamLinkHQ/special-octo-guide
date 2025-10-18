import { RiLink } from "react-icons/ri";
import { IoIosClose } from "react-icons/io";
import { FiCopy } from "react-icons/fi";
// import { Modal } from "../ui";
import { copyText } from "../../utils";

type Stream = {
  name: string;
  streamSessionType: string;
};
type ShareModalProps = {
  stream: Stream;
  closeFunc: () => void;
};

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

const ShareModal = ({
  stream: { name, streamSessionType },
  closeFunc,
}: ShareModalProps) => {
  return (
    <Modal bgColor="bg-modal-black">
      <div className="bg-white relative rounded-lg w-[80%] lg:!w-[350px]">
        <div
          className="bg-white p-1.5 absolute -top-2.5 -right-1.5 rounded cursor-pointer"
          onClick={closeFunc}
        >
          <IoIosClose className="text-black text-lg" />
        </div>
        <div className="p-2 flex flex-col gap-y-2 lg:!gap-y-3">
          <div className="flex flex-row items-center gap-x-1">
            <p className="text-[#626262] text-sm font-inter">Welcome!</p>
            <span>🥳</span>
          </div>

          <p className="text-xl text-[#3A3A3A] font-semibold font-poppins">
            Join {streamSessionType} info
          </p>
          <p className="text-[#626262] text-sm">
            Share this with people you’d like to meet with, be sure to save this
            link so you could join as its host.
          </p>
          <div className="border border-primary flex flex-row items-center rounded-xl p-0.5 justify-between">
            <div className="flex flex-row items-center gap-x-1 flex-1 min-w-0">
              <div className="bg-[#DCCCF63D] p-1 rounded-l-xl flex-shrink-0">
                <RiLink className="" />
              </div>
              <p className="text-sm truncate min-w-0 flex-1">
                {`${window.location.hostname}/${name}`}
              </p>
            </div>
            <div
              onClick={() =>
                copyText(`${window.location.hostname}/${name}`, "Link copied")
              }
              className="cursor-pointer p-1.5 rounded-lg bg-primary flex-shrink-0 ml-1"
            >
              <FiCopy className="text-white" />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ShareModal;
