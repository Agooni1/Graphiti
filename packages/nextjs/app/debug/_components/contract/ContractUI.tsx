"use client";

// @refresh reset
import { useReducer } from "react";
import { ContractReadMethods } from "./ContractReadMethods";
import { ContractVariables } from "./ContractVariables";
import { ContractWriteMethods } from "./ContractWriteMethods";
import { Address, Balance } from "~~/components/scaffold-eth";
import { useDeployedContractInfo, useNetworkColor } from "~~/hooks/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { ContractName } from "~~/utils/scaffold-eth/contract";

type ContractUIProps = {
  contractName: ContractName;
  className?: string;
};

/**
 * UI component to interface with deployed contracts.
 **/
export const ContractUI = ({ contractName, className = "" }: ContractUIProps) => {
  const [refreshDisplayVariables, triggerRefreshDisplayVariables] = useReducer(value => !value, false);
  const { targetNetwork } = useTargetNetwork();
  const { data: deployedContractData, isLoading: deployedContractLoading } = useDeployedContractInfo({ contractName });
  const networkColor = useNetworkColor();

  if (deployedContractLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="bg-slate-800/40 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-8">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-slate-300">Loading contract...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!deployedContractData) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="bg-slate-800/40 backdrop-blur-sm border border-red-500/20 rounded-2xl p-8 text-center">
          <div className="text-6xl mb-4 opacity-50">⚠️</div>
          <div className="text-slate-300 text-xl mb-2 font-medium">Contract Not Found</div>
          <p className="text-slate-400">
            No contract found by the name of "{contractName}" on chain "{targetNetwork.name}"
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-6 px-6 lg:px-10 lg:gap-8 w-full max-w-7xl my-0 ${className}`}>
      <div className="col-span-5 grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        
        {/* Contract Info Panel */}
        <div className="col-span-1 flex flex-col">
          <div className="bg-slate-800/40 backdrop-blur-sm border border-blue-500/20 rounded-2xl shadow-2xl p-6 mb-6 relative">
            <div className="flex flex-col space-y-4">
              <div className="text-center">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                  {contractName}
                </h3>
                <div className="bg-black/20 rounded-lg p-3 border border-white/10">
                  <Address address={deployedContractData.address} />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/20 rounded-lg p-3 border border-white/10 text-center">
                  <div className="text-green-400 text-xs font-medium mb-1">Balance</div>
                  <Balance address={deployedContractData.address} className="text-white font-bold text-sm" />
                </div>
                
                {targetNetwork && (
                  <div className="bg-black/20 rounded-lg p-3 border border-white/10 text-center">
                    <div className="text-cyan-400 text-xs font-medium mb-1">Network</div>
                    <span className="text-white font-bold text-sm" style={{ color: networkColor }}>
                      {targetNetwork.name}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Contract Variables */}
          <div className="bg-slate-800/40 backdrop-blur-sm border border-purple-500/20 rounded-2xl shadow-2xl p-6">
            <h4 className="text-lg font-semibold text-purple-300 mb-4 flex items-center">
              <span className="mr-2">📊</span>
              Variables
            </h4>
            <ContractVariables
              refreshDisplayVariables={refreshDisplayVariables}
              deployedContractData={deployedContractData}
            />
          </div>
        </div>

        {/* Read Methods */}
        <div className="col-span-1 lg:col-span-2 flex flex-col gap-6">
          <div className="bg-slate-800/40 backdrop-blur-sm border border-blue-500/20 rounded-2xl shadow-2xl relative">
            <div className="p-6">
              <h4 className="text-lg font-semibold text-blue-300 mb-4 flex items-center">
                Read Methods
              </h4>
              <div className="space-y-4">
                <ContractReadMethods deployedContractData={deployedContractData} />
              </div>
            </div>
          </div>

          {/* Write Methods */}
          <div className="bg-slate-800/40 backdrop-blur-sm border border-orange-500/20 rounded-2xl shadow-2xl relative">
            <div className="p-6">
              <h4 className="text-lg font-semibold text-orange-300 mb-4 flex items-center">
                <span className="mr-2">✏️</span>
                Write Methods
              </h4>
              <div className="space-y-4">
                <ContractWriteMethods
                  deployedContractData={deployedContractData}
                  onChange={triggerRefreshDisplayVariables}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
