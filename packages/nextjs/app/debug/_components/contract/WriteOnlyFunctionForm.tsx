"use client";

import { useEffect, useState } from "react";
import { InheritanceTooltip } from "./InheritanceTooltip";
import { Abi, AbiFunction } from "abitype";
import { Address, TransactionReceipt } from "viem";
import { useAccount, useConfig, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import {
  ContractInput,
  TxReceipt,
  getFunctionInputKey,
  getInitialFormState,
  getParsedContractFunctionArgs,
  transformAbiFunction,
} from "~~/app/debug/_components/contract";
import { IntegerInput } from "~~/components/scaffold-eth";
import { useTransactor } from "~~/hooks/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { simulateContractWriteAndNotifyError } from "~~/utils/scaffold-eth/contract";

type WriteOnlyFunctionFormProps = {
  abi: Abi;
  abiFunction: AbiFunction;
  onChange: () => void;
  contractAddress: Address;
  inheritedFrom?: string;
};

export const WriteOnlyFunctionForm = ({
  abi,
  abiFunction,
  onChange,
  contractAddress,
  inheritedFrom,
}: WriteOnlyFunctionFormProps) => {
  const [form, setForm] = useState<Record<string, any>>(() => getInitialFormState(abiFunction));
  const [txValue, setTxValue] = useState<string>("");
  const { chain } = useAccount();
  const writeTxn = useTransactor();
  const { targetNetwork } = useTargetNetwork();
  const writeDisabled = !chain || chain?.id !== targetNetwork.id;

  const { data: result, isPending, writeContractAsync } = useWriteContract();

  const wagmiConfig = useConfig();

  const handleWrite = async () => {
    if (writeContractAsync) {
      try {
        const writeContractObj = {
          address: contractAddress,
          functionName: abiFunction.name,
          abi: abi,
          args: getParsedContractFunctionArgs(form),
          value: BigInt(txValue),
        };
        await simulateContractWriteAndNotifyError({ wagmiConfig, writeContractParams: writeContractObj });

        const makeWriteWithParams = () => writeContractAsync(writeContractObj);
        await writeTxn(makeWriteWithParams);
        onChange();
      } catch (e: any) {
        console.error("⚡️ ~ file: WriteOnlyFunctionForm.tsx:handleWrite ~ error", e);
      }
    }
  };

  const [displayedTxResult, setDisplayedTxResult] = useState<TransactionReceipt>();
  const { data: txResult } = useWaitForTransactionReceipt({
    hash: result,
  });
  useEffect(() => {
    setDisplayedTxResult(txResult);
  }, [txResult]);

  const transformedFunction = transformAbiFunction(abiFunction);
  const inputs = transformedFunction.inputs.map((input, inputIndex) => {
    const key = getFunctionInputKey(abiFunction.name, input, inputIndex);
    return (
      <ContractInput
        key={key}
        setForm={updatedFormValue => {
          setDisplayedTxResult(undefined);
          setForm(updatedFormValue);
        }}
        form={form}
        stateObjectKey={key}
        paramType={input}
      />
    );
  });
  const zeroInputs = inputs.length === 0 && abiFunction.stateMutability !== "payable";

  return (
    <div className="bg-black/20 rounded-lg p-4 border border-white/10 space-y-4">
      <div className="flex items-center justify-between">
        <h5 className="text-orange-300 font-medium flex items-center">
          {abiFunction.name}
          <InheritanceTooltip inheritedFrom={inheritedFrom} />
        </h5>
      </div>

      <div className="space-y-4">
        {inputs.length > 0 && (
          <div className="space-y-3">
            {inputs}
          </div>
        )}
        
        {abiFunction.stateMutability === "payable" && (
          <div className="bg-slate-900/40 rounded-lg p-3 border border-yellow-400/20">
            <div className="text-yellow-300 text-sm font-medium mb-2 flex items-center">
              <span className="mr-2">💰</span>
              Payable Amount (wei)
            </div>
            <IntegerInput
              value={txValue}
              onChange={updatedTxValue => {
                setDisplayedTxResult(undefined);
                setTxValue(updatedTxValue);
              }}
              placeholder="0"
            />
          </div>
        )}

        <div className="flex flex-col lg:flex-row justify-between gap-4">
          {!zeroInputs && displayedTxResult && (
            <div className="flex-1">
              <TxReceipt txResult={displayedTxResult} />
            </div>
          )}
          
          <div className="flex items-center">
            {writeDisabled && (
              <div className="text-red-400 text-sm mr-4">
                ⚠️ Connect wallet or switch network
              </div>
            )}
            
            <button 
              className="bg-orange-600/20 hover:bg-orange-600/30 border border-orange-400/30 rounded-lg px-4 py-2 font-medium transition-all duration-200 text-orange-300 hover:text-orange-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={writeDisabled || isPending} 
              onClick={handleWrite}
            >
              {isPending ? (
                <>
                  <div className="w-4 h-4 border border-orange-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <span>Send</span>
                </>
              )}
            </button>
          </div>
        </div>

        {zeroInputs && txResult && (
          <div className="mt-4">
            <TxReceipt txResult={txResult} />
          </div>
        )}
      </div>
    </div>
  );
};
