// "use client";
import Wrapper  from "./Wrapper";
import { Address} from "~~/components/scaffold-eth"

interface Transfer {
  hash: string;
  date: string;
  category: string | null;
}

interface WrapperChildProps {
  address: string;
  depth?: number;
  transferList?: Transfer[];
}

export const WrapperChild = ({ address, depth = 0, transferList = [] }: WrapperChildProps) => {
  const mostRecent = transferList[0];

  return (
    <div className="relative">
      <Wrapper
        address={address}
        txList={transferList}
      />
    </div>
  );
};