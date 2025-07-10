"use client";

import { AllHoldings } from "./_components";
import type { NextPage } from "next";


const AllNFTs: NextPage = () => {
  
  return (
    <>
      <div className="flex items-center flex-col pt-10">
        <div className="px-5">
          <h1 className="text-center mb-8">
            <span className="block text-4xl font-bold">All NFTs</span>
            <span className="block text-lg text-slate-400 mt-2">
              Browse all address's minted on the platform
            </span>
          </h1>
        </div>
      </div>

      <AllHoldings />
    </>
  );
};

export default AllNFTs;