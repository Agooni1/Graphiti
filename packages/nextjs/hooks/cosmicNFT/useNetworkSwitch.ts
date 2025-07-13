import { useSwitchChain } from "wagmi";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { getChainId, type SupportedChain } from "~~/utils/cosmicNFT/chainHelpers";
import { notification } from "~~/utils/scaffold-eth";

export function useNetworkSwitch() {
  const { switchChain } = useSwitchChain();
  const { targetNetwork } = useTargetNetwork();

  const switchToChain = async (chain: SupportedChain) => {
    const chainId = getChainId(chain);
    
    try {
      if (switchChain) {
        await switchChain({ chainId });
      } else {
        notification.error("Wallet doesn't support network switching");
      }
    } catch (error) {
      console.error("Failed to switch network:", error);
      notification.error(`Failed to switch to ${chain}`);
    }
  };

  return {
    switchToChain,
    currentChainId: targetNetwork.id,
  };
}