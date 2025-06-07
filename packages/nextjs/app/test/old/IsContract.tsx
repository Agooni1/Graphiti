"use client";
import { useEffect, useState } from "react";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { useGlobalState } from "~~/services/store/store";
import { alchemy } from "~~/app/lib/alchemy";
import { AddressType } from "~~/types/abitype/abi";


type IsContractProps = {
  // address: AddressType;
  address: string;
};


export const IsContract = ({ address }: IsContractProps) => {
   const [isContract, setIsContract] = useState<string | null>(null);
   const [bytecode, setBytecode] = useState<string | null>(null);

   useEffect(() => {
    const checkIsContract = async () => {
      try {
        const bytecode = await alchemy.core.getCode(address);
        setIsContract(bytecode !== "0x" ? "Yes" : "No");
        setBytecode(bytecode !== "0x" ? bytecode : null);
      } catch (err) {
        console.error("Failed to check contract status:", err);
        setIsContract("Error");
      }
    };

    if (address) {
      checkIsContract();
    }
  }, [address]);

  return (
    <div>
        <p>Is Contract: {isContract !== null ? isContract : "Loading..."}</p>
        {/* {isContract === "Yes" && bytecode && (
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
            <strong>Bytecode:</strong> {bytecode}
          </pre>
        )} */}
    </div>

  );
};