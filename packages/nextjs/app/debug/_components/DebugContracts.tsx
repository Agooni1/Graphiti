"use client";

import { useEffect, useMemo } from "react";
import { useSessionStorage } from "usehooks-ts";
import { BarsArrowUpIcon } from "@heroicons/react/20/solid";
import { ContractUI } from "~~/app/debug/_components/contract";
import { ContractName, GenericContract } from "~~/utils/scaffold-eth/contract";
import { useAllContracts } from "~~/utils/scaffold-eth/contractsData";

const selectedContractStorageKey = "scaffoldEth2.selectedContract";

export function DebugContracts() {
  const contractsData = useAllContracts();
  const contractNames = useMemo(
    () =>
      Object.keys(contractsData).sort((a, b) => {
        return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
      }) as ContractName[],
    [contractsData],
  );

  const [selectedContract, setSelectedContract] = useSessionStorage<ContractName>(
    selectedContractStorageKey,
    contractNames[0],
    { initializeWithValue: false },
  );

  useEffect(() => {
    if (!contractNames.includes(selectedContract)) {
      setSelectedContract(contractNames[0]);
    }
  }, [contractNames, selectedContract, setSelectedContract]);

  return (
    <div className="flex flex-col gap-y-6 lg:gap-y-8 py-8 lg:py-12 justify-center items-center">
      {contractNames.length === 0 ? (
        <div className="bg-slate-800/40 backdrop-blur-sm border border-blue-500/20 rounded-2xl shadow-2xl p-8 text-center relative z-10">
          <div className="text-6xl mb-4 opacity-50">🔧</div>
          <div className="text-slate-300 text-xl mb-4 font-medium">No contracts found!</div>
          <div className="text-slate-400">Deploy some contracts to see them here</div>
        </div>
      ) : (
        <>
          {contractNames.length > 1 && (
            <div className="flex flex-row gap-2 w-full max-w-7xl pb-1 px-6 lg:px-10 flex-wrap">
              {contractNames.map(contractName => (
                <button
                  className={`bg-slate-800/40 backdrop-blur-sm border border-blue-500/20 rounded-lg px-4 py-2 font-medium transition-all duration-200 hover:border-white/30 hover:bg-slate-700/40 ${
                    contractName === selectedContract
                      ? "bg-blue-600/30 border-blue-400/40 text-blue-200"
                      : "text-slate-300 hover:text-white"
                  }`}
                  key={contractName}
                  onClick={() => setSelectedContract(contractName)}
                >
                  {contractName}
                  {(contractsData[contractName] as GenericContract)?.external && (
                    <span className="ml-2 text-cyan-400" title="External contract">
                      <BarsArrowUpIcon className="h-4 w-4 inline" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
          <div className="w-full">
            {contractNames.map(contractName => (
              <ContractUI
                key={contractName}
                contractName={contractName}
                className={contractName === selectedContract ? "" : "hidden"}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
