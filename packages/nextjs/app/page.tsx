"use client";

import Link from "next/link";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { SparklesIcon, MagnifyingGlassIcon, BugAntIcon, GlobeAltIcon } from "@heroicons/react/24/outline";
import { Address } from "~~/components/scaffold-eth";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();

  return (
    <>
      {/* Cosmic Background */}
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
        {/* Animated Stars Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="stars"></div>
          <div className="twinkling"></div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 flex items-center flex-col grow pt-20">
          <div className="px-5 text-center max-w-4xl">
            {/* Hero Section */}
            <div className="mb-12">
              <div className="text-6xl mb-4">🌌</div>
              <h1 className="text-center mb-8">
                <span className="block text-2xl mb-4 text-blue-200 font-light">Welcome to</span>
                <span className="block text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  EtherVerse
                </span>
                <span className="block text-lg mt-4 text-slate-300 font-light">
                  Explore the Ethereum Universe in 3D
                </span>
              </h1>
              
              {connectedAddress && (
                <div className="flex justify-center items-center space-x-2 flex-col mb-8">
                  <p className="my-2 font-medium text-blue-200">Your Cosmic Address:</p>
                  <div className="bg-slate-800/50 backdrop-blur-sm rounded-full px-6 py-3 border border-blue-500/30">
                    <Address address={connectedAddress} />
                  </div>
                </div>
              )}

              <p className="text-slate-300 text-xl leading-relaxed mb-8">
                Discover the hidden connections in the Ethereum blockchain through an immersive 3D galaxy visualization. 
                Watch as transactions flow like cosmic energy between stellar nodes, revealing the true structure of the decentralized universe.
              </p>

              {/* CTA Button */}
              <Link href="/test" className="group">
                <button className="relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-full text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25 border border-blue-400/30">
                  <span className="flex items-center gap-3">
                    <SparklesIcon className="h-6 w-6 group-hover:animate-spin" />
                    Launch Galaxy Explorer
                    <SparklesIcon className="h-6 w-6 group-hover:animate-spin" />
                  </span>
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                </button>
              </Link>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grow w-full mt-16 px-8 py-12">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Explore the Cosmos
              </h2>
              
              <div className="grid md:grid-cols-3 gap-8">
                {/* Galaxy Visualizer Card */}
                <div className="group relative bg-slate-800/40 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-8 text-center hover:border-blue-400/40 transition-all duration-300 hover:scale-105">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10">
                    <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <SparklesIcon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-4 text-blue-100">Galaxy Visualizer</h3>
                    <p className="text-slate-300 mb-6 leading-relaxed">
                      Experience Ethereum addresses as celestial bodies in a 3D galaxy. Watch transactions flow as cosmic energy between connected nodes.
                    </p>
                    <Link href="/test" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-medium transition-colors">
                      Explore Galaxy <SparklesIcon className="h-4 w-4" />
                    </Link>
                  </div>
                </div>

                {/* Debug Contracts Card */}
                <div className="group relative bg-slate-800/40 backdrop-blur-sm border border-green-500/20 rounded-2xl p-8 text-center hover:border-green-400/40 transition-all duration-300 hover:scale-105">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10">
                    <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                      <BugAntIcon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-4 text-green-100">Debug Contracts</h3>
                    <p className="text-slate-300 mb-6 leading-relaxed">
                      Interact with smart contracts directly. Test functions, read state, and debug your decentralized applications.
                    </p>
                    <Link href="/debug" className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 font-medium transition-colors">
                      Debug Code <BugAntIcon className="h-4 w-4" />
                    </Link>
                  </div>
                </div>

                {/* Block Explorer Card */}
                <div className="group relative bg-slate-800/40 backdrop-blur-sm border border-cyan-500/20 rounded-2xl p-8 text-center hover:border-cyan-400/40 transition-all duration-300 hover:scale-105">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10">
                    <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
                      <MagnifyingGlassIcon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-4 text-cyan-100">Block Explorer</h3>
                    <p className="text-slate-300 mb-6 leading-relaxed">
                      Navigate through blocks and transactions. Explore the blockchain data with an intuitive interface.
                    </p>
                    <Link href="/blockexplorer" className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
                      Explore Blocks <MagnifyingGlassIcon className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Features Grid */}
              <div className="mt-16 grid md:grid-cols-2 gap-8">
                <div className="bg-slate-800/20 backdrop-blur-sm border border-slate-700/30 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-blue-100 mb-3 flex items-center gap-2">
                    <GlobeAltIcon className="h-5 w-5" />
                    3D Universe Navigation
                  </h4>
                  <p className="text-slate-300">
                    Pan, zoom, and orbit through space. Experience blockchain data in an entirely new dimension with smooth 3D controls.
                  </p>
                </div>
                <div className="bg-slate-800/20 backdrop-blur-sm border border-slate-700/30 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-purple-100 mb-3 flex items-center gap-2">
                    <SparklesIcon className="h-5 w-5" />
                    Real-time Particles
                  </h4>
                  <p className="text-slate-300">
                    Watch transactions flow as animated particles between nodes. Switch between pulse and laser modes for different visual effects.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
