"use client";

import { useEffect } from "react";
import { InheritanceTooltip } from "./InheritanceTooltip";
import { displayTxResult } from "./utilsDisplay";
import { Abi, AbiFunction } from "abitype";
import { Address } from "viem";
import { useReadContract } from "wagmi";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { useAnimationConfig } from "~~/hooks/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { getParsedError, notification } from "~~/utils/scaffold-eth";

type DisplayVariableProps = {
  contractAddress: Address;
  abiFunction: AbiFunction;
  refreshDisplayVariables: boolean;
  inheritedFrom?: string;
  abi: Abi;
};

export const DisplayVariable = ({
  contractAddress,
  abiFunction,
  refreshDisplayVariables,
  abi,
  inheritedFrom,
}: DisplayVariableProps) => {
  const { targetNetwork } = useTargetNetwork();

  const {
    data: result,
    isFetching,
    refetch,
    error,
  } = useReadContract({
    address: contractAddress,
    functionName: abiFunction.name,
    abi: abi,
    chainId: targetNetwork.id,
    query: {
      retry: false,
    },
  });

  const { showAnimation } = useAnimationConfig(result);

  useEffect(() => {
    refetch();
  }, [refetch, refreshDisplayVariables]);

  useEffect(() => {
    if (error) {
      const parsedError = getParsedError(error);
      notification.error(parsedError);
    }
  }, [error]);

  return (
    <div className="bg-black/20 rounded-lg p-4 border border-white/10 space-y-3">
      <div className="flex items-center justify-between">
        <h5 className="text-purple-300 font-medium text-sm flex items-center">
          {abiFunction.name}
          <InheritanceTooltip inheritedFrom={inheritedFrom} />
        </h5>
        <button
          className="bg-purple-600/20 hover:bg-purple-600/30 border border-purple-400/30 rounded-lg px-2 py-1 transition-all duration-200 flex items-center space-x-1"
          onClick={async () => await refetch()}
          disabled={isFetching}
        >
          {isFetching ? (
            <div className="w-3 h-3 border border-purple-400 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <ArrowPathIcon className="h-3 w-3 text-purple-300" />
          )}
        </button>
      </div>

      <div className="bg-slate-900/40 rounded-lg p-3 border border-white/5">
        <div
          className={`text-slate-200 text-sm transition-all duration-200 ${
            showAnimation ? "bg-yellow-500/20 rounded px-2 py-1" : ""
          }`}
        >
          {displayTxResult(result)}
        </div>
      </div>
    </div>
  );
};
