import { DebugContracts } from "./_components/DebugContracts";
import type { NextPage } from "next";
import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

export const metadata = getMetadata({
  title: "Debug Contracts",
  description: "Debug your deployed 🏗 Scaffold-ETH 2 contracts in an easy way",
});

const Debug: NextPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Stars Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="stars"></div>
        <div className="twinkling"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center py-6">
        {/* Header Section */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            Debug Contracts
          </h1>
          <span className="block text-lg text-slate-400">
            Debug & interact with your deployed contracts
          </span>
        </div>

        {/* Content Area */}
        <div className="w-full max-w-7xl">
          <DebugContracts />
        </div>
      </div>
    </div>
  );
};

export default Debug;
