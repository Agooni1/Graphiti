"use client";

import { useEffect, useState } from "react";
import { InheritanceTooltip } from "./InheritanceTooltip";
import { Abi, AbiFunction } from "abitype";
import { Address } from "viem";
import { useReadContract } from "wagmi";
import {
  ContractInput,
  displayTxResult,
  getFunctionInputKey,
  getInitialFormState,
  getParsedContractFunctionArgs,
  transformAbiFunction,
} from "~~/app/debug/_components/contract";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { getParsedError, notification } from "~~/utils/scaffold-eth";

type ReadOnlyFunctionFormProps = {
  contractAddress: Address;
  abiFunction: AbiFunction;
  inheritedFrom?: string;
  abi: Abi;
};

export const ReadOnlyFunctionForm = ({
  contractAddress,
  abiFunction,
  inheritedFrom,
  abi,
}: ReadOnlyFunctionFormProps) => {
  const [form, setForm] = useState<Record<string, any>>(() => getInitialFormState(abiFunction));
  const [result, setResult] = useState<unknown>();
  const { targetNetwork } = useTargetNetwork();

  const { isFetching, refetch, error } = useReadContract({
    address: contractAddress,
    functionName: abiFunction.name,
    abi: abi,
    args: getParsedContractFunctionArgs(form),
    chainId: targetNetwork.id,
    query: {
      enabled: false,
      retry: false,
    },
  });

  useEffect(() => {
    if (error) {
      const parsedError = getParsedError(error);
      notification.error(parsedError);
    }
  }, [error]);

  const transformedFunction = transformAbiFunction(abiFunction);
  const inputElements = transformedFunction.inputs.map((input, inputIndex) => {
    const key = getFunctionInputKey(abiFunction.name, input, inputIndex);
    return (
      <ContractInput
        key={key}
        setForm={updatedFormValue => {
          setResult(undefined);
          setForm(updatedFormValue);
        }}
        form={form}
        stateObjectKey={key}
        paramType={input}
      />
    );
  });

  return (
    <div className="bg-black/20 rounded-lg p-4 border border-white/10 space-y-4">
      <div className="flex items-center justify-between">
        <h5 className="text-blue-300 font-medium flex items-center">
          {abiFunction.name}
          <InheritanceTooltip inheritedFrom={inheritedFrom} />
        </h5>
      </div>

      {inputElements.length > 0 && (
        <div className="space-y-3">
          {inputElements}
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex-1">
          {result !== null && result !== undefined && (
            <div className="bg-slate-900/40 rounded-lg p-3 border border-white/5">
              <div className="text-blue-300 text-sm font-medium mb-2">Result:</div>
              <div className="text-slate-200 text-sm break-words">
                {displayTxResult(result, "sm")}
              </div>
            </div>
          )}
        </div>

        <button
          className="bg-blue-600/20 hover:bg-blue-600/30 border border-blue-400/30 rounded-lg px-4 py-2 font-medium transition-all duration-200 text-blue-300 hover:text-blue-200 flex items-center space-x-2 self-start"
          onClick={async () => {
            const { data } = await refetch();
            setResult(data);
          }}
          disabled={isFetching}
        >
          {isFetching ? (
            <>
              <div className="w-4 h-4 border border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              <span>Reading...</span>
            </>
          ) : (
            <>

              <span>Read</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
