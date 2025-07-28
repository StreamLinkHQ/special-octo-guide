import { useState } from "react";

type TooltipProps = { children: React.ReactNode; content: string };

const Tooltip = ({ content, children }: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className="group relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className="absolute z-10 px-2 py-1 text-sm text-white bg-black rounded-md opacity-90 whitespace-nowrap bottom-full left-1/2 transform -translate-x-1/2 mb-2">
          {content}
        </div>
      )}
    </div>
  );
};

export default Tooltip;
