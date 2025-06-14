import React from "react";
import Link from "next/link";
import { hardhat } from "viem/chains";
import { CurrencyDollarIcon, MagnifyingGlassIcon, HeartIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { SwitchTheme } from "~~/components/SwitchTheme";
import { BuidlGuidlLogo } from "~~/components/assets/BuidlGuidlLogo";
import { Faucet } from "~~/components/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { useGlobalState } from "~~/services/store/store";

/**
 * Site footer - positioned at bottom of each page
 */
export const Footer = () => {
  const nativeCurrencyPrice = useGlobalState(state => state.nativeCurrency.price);
  const { targetNetwork } = useTargetNetwork();
  const isLocalNetwork = targetNetwork.id === hardhat.id;

  return (
    <footer className="w-full bg-slate-800/20 backdrop-blur-sm border-t border-slate-700/30 mt-auto">
      {/* Main footer content */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-4 p-6">
        
        {/* Left side - Utility widgets */}
        <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
          {nativeCurrencyPrice > 0 && (
            <div className="bg-slate-800/80 backdrop-blur-sm border border-blue-500/30 text-blue-200 btn-sm font-normal gap-1 cursor-auto px-3 py-2 rounded-full flex items-center">
              <CurrencyDollarIcon className="h-4 w-4" />
              <span>{nativeCurrencyPrice.toFixed(2)}</span>
            </div>
          )}
          {isLocalNetwork && (
            <>
              <div className="[&>*]:bg-slate-800/80 [&>*]:backdrop-blur-sm [&>*]:border-green-500/30 [&>*]:text-green-200 [&>*]:hover:bg-slate-700/80 [&>*]:rounded-full">
                <Faucet />
              </div>
              <Link href="/blockexplorer" passHref className="bg-slate-800/80 backdrop-blur-sm border border-cyan-500/30 text-cyan-200 hover:bg-slate-700/80 btn-sm font-normal gap-1 px-3 py-2 rounded-full flex items-center transition-all duration-300">
                <MagnifyingGlassIcon className="h-4 w-4" />
                <span>Block Explorer</span>
              </Link>
            </>
          )}
        </div>

        {/* Center - Footer links */}
        <div className="flex items-center gap-2 text-sm order-3 lg:order-2">
          <a 
            href="https://github.com/scaffold-eth/se-2" 
            target="_blank" 
            rel="noreferrer" 
            className="text-blue-400 hover:text-blue-300 transition-colors duration-300 flex items-center gap-1"
          >
            <SparklesIcon className="h-3 w-3" />
            Fork me
          </a>
          <span className="text-slate-500">·</span>
          <div className="flex items-center gap-1">
            <span className="text-slate-300">Built with</span>
            <HeartIcon className="h-3 w-3 text-red-400" />
            <span className="text-slate-300">at</span>
            <a
              className="text-purple-400 hover:text-purple-300 transition-colors duration-300 flex items-center gap-1"
              href="https://buidlguidl.com/"
              target="_blank"
              rel="noreferrer"
            >
              <BuidlGuidlLogo className="w-3 h-5" />
              <span>BuidlGuidl</span>
            </a>
          </div>
          <span className="text-slate-500">·</span>
          <a 
            href="https://t.me/joinchat/KByvmRe5wkR-8F_zz6AjpA" 
            target="_blank" 
            rel="noreferrer" 
            className="text-cyan-400 hover:text-cyan-300 transition-colors duration-300"
          >
            Support
          </a>
        </div>

        {/* Right side - Theme switch */}
        <div className="order-2 lg:order-3">
          <SwitchTheme className="bg-slate-800/80 backdrop-blur-sm border border-purple-500/30 text-purple-200 hover:bg-slate-700/80 transition-all duration-300 rounded-full" />
        </div>
        
      </div>
    </footer>
  );
};