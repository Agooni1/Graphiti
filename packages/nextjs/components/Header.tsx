"use client";

import React, { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { hardhat } from "viem/chains";
import { Bars3Icon, BugAntIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { FaucetButton, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useOutsideClick, useTargetNetwork } from "~~/hooks/scaffold-eth";

type HeaderMenuLink = {
  label: string;
  href: string;
  icon?: React.ReactNode;
};

export const menuLinks: HeaderMenuLink[] = [
  {
    label: "Explorer",
    href: "/test",
    icon: <SparklesIcon className="h-4 w-4" />,
  },
  {
    label: "My NFTs",
    href: "/myNFTs",
    icon: <BugAntIcon className="h-4 w-4" />,
  },
  {
    label: "mINTER",
    href: "/cosmicMinter",
    icon: <SparklesIcon className="h-4 w-4" />,
    // icon: <BugAntIcon className="h-4 w-4" />,
  },
  {
    label: "Debug Contracts",
    href: "/debug",
    icon: <BugAntIcon className="h-4 w-4" />,
  },
];

export const HeaderMenuLinks = () => {
  const pathname = usePathname();

  return (
    <>
      {menuLinks.map(({ label, href, icon }) => {
        const isActive = pathname === href;
        return (
          <li key={href}>
            <Link
              href={href}
              passHref
              className={`${
                isActive 
                  ? "bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-400/30 text-blue-200" 
                  : "text-slate-300 hover:text-white border border-transparent"
              } hover:bg-slate-700/30 hover:border-slate-500/30 transition-all duration-300 py-2 px-4 text-sm rounded-full gap-2 flex items-center backdrop-blur-sm`}
            >
              {icon}
              <span>{label}</span>
            </Link>
          </li>
        );
      })}
    </>
  );
};

/**
 * Site header
 */
export const Header = () => {
  const { targetNetwork } = useTargetNetwork();
  const isLocalNetwork = targetNetwork.id === hardhat.id;

  const burgerMenuRef = useRef<HTMLDetailsElement>(null);
  useOutsideClick(burgerMenuRef, () => {
    burgerMenuRef?.current?.removeAttribute("open");
  });

  return (
    <div className="sticky lg:static top-0 navbar bg-slate-900/80 backdrop-blur-md border-b border-slate-700/30 min-h-0 shrink-0 justify-between z-20 px-0 sm:px-2">
      <div className="navbar-start w-auto lg:w-1/2">
        <details className="dropdown" ref={burgerMenuRef}>
          <summary className="ml-1 btn btn-ghost lg:hidden hover:bg-slate-700/30 text-slate-300">
            <Bars3Icon className="h-5 w-5" />
          </summary>
          <ul
            className="menu menu-compact dropdown-content mt-3 p-2 shadow-2xl bg-slate-800/95 backdrop-blur-md border border-slate-600/30 rounded-2xl w-52"
            onClick={() => {
              burgerMenuRef?.current?.removeAttribute("open");
            }}
          >
            <HeaderMenuLinks />
          </ul>
        </details>
        
        <Link href="/" passHref className="hidden lg:flex items-center gap-3 ml-4 mr-6 shrink-0 group">
          <div className="flex relative w-10 h-10">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
            <div className="relative flex items-center justify-center w-full h-full bg-slate-800 rounded-lg border border-blue-500/30">
              <span className="text-xl">🌌</span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-bold leading-tight bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              EtherVerse
            </span>
            <span className="text-xs text-slate-400">Ethereum Universe</span>
          </div>
        </Link>
        
        <ul className="hidden lg:flex lg:flex-nowrap menu menu-horizontal px-1 gap-2">
          <HeaderMenuLinks />
        </ul>
      </div>
      
      <div className="navbar-end grow mr-4 flex items-center gap-3">
        <RainbowKitCustomConnectButton />
        {isLocalNetwork && <FaucetButton />}
      </div>
    </div>
  );
};
