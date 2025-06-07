import { useEffect, useState } from "react";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { useGlobalState } from "~~/services/store/store";
// import { alchemy } from "~~/app/lib/alchemy";
import { AddressType } from "~~/types/abitype/abi";
import { Address } from "~~/components/scaffold-eth";
import { AddressCopyIcon } from "~~/components/scaffold-eth/Address/AddressCopyIcon";


import {
  ETHBalance,
  TokenBalances,
  NFTList,
  TokenMetadata,
  TransferHistory,
  IsContract,
} from "./";

// import { ETHBalance } from "./ETHBalance";
// import { TokenBalances } from "./TokenBalances";




type WrapperProps = {
  address: string;
  txList?: { hash: string; date: string; category: string | null }[];
};


const Wrapper = ({ address, txList = [] }: WrapperProps) => {
  return (
    <div className="bg-base-100 text-white shadow-lg rounded-lg p-6 mt-6 max-w-xl mx-auto">
      
      <h2 className="text-lg font-bold mb-4">Target Overview</h2>

      <div className="mb-3">
        <span className="font-medium text-gray-400">Address:</span>
        {/* <div className="truncate">{address}</div> */}
        <Address address={address} />
      </div>

      
      {/* <Address address={deployedContractData.address} onlyEnsOrAddress /> */}

      <ETHBalance address={address} />

      <div className="mb-3">
        <span className="font-medium text-gray-400">Contract:</span>
        <IsContract address={address} />
      </div>
      {txList.length > 0 && (
        <div className="mt-4">
          <div className="font-medium text-gray-400 mb-1">Recent Transfers:</div>
          {txList.map((tx, index) => (
            <div key={tx.hash + index} className="text-xs text-gray-400 mb-2">
              <div>
                <span className="font-medium">Hash:</span> {tx.hash}
                <AddressCopyIcon className="ml-1 h-4 w-4 cursor-pointer inline" address={tx.hash} />
              </div>
              <div><span className="font-medium">Category:</span> {tx.category}</div>
              <div><span className="font-medium">Date:</span> {tx.date}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Wrapper;

{/* <TokenBalances address = {address} />
      <NFTList address = {address} />
      <TransferHistory address = {address} />
      <TokenMetadata address= {address} /> */}