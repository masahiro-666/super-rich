"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { INITIAL_MONEY, MONEY_BREAKDOWN } from "@/types/game";

export default function Setup() {
  const router = useRouter();
  const [playerCount, setPlayerCount] = useState(2);
  const [playerNames, setPlayerNames] = useState<string[]>([
    "Player 1",
    "Player 2",
  ]);

  const handlePlayerCountChange = (count: number) => {
    setPlayerCount(count);
    const names = Array.from({ length: count }, (_, i) => `Player ${i + 1}`);
    setPlayerNames(names);
  };

  const handleNameChange = (index: number, name: string) => {
    const newNames = [...playerNames];
    newNames[index] = name;
    setPlayerNames(newNames);
  };

  const handleStartGame = () => {
    const players = playerNames.map((name, index) => ({
      id: index,
      name,
      balance: INITIAL_MONEY,
    }));

    localStorage.setItem(
      "monopoly-game",
      JSON.stringify({
        players,
        bank: { id: -1, name: "Bank", balance: 1000000, isBank: true },
        transactions: [],
      }),
    );

    router.push("/game");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 to-emerald-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
        <h1 className="text-4xl font-bold text-center mb-2 text-gray-800">
          Monopoly Money
        </h1>
        <p className="text-center text-gray-600 mb-8">Digital Banking System</p>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            Number of Players
          </h2>
          <div className="flex gap-3 flex-wrap">
            {[2, 3, 4, 5, 6].map((count) => (
              <button
                key={count}
                onClick={() => handlePlayerCountChange(count)}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  playerCount === count
                    ? "bg-green-600 text-white shadow-lg scale-105"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {count} Players
              </button>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            Player Names
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {playerNames.map((name, index) => (
              <input
                key={index}
                type="text"
                value={name}
                onChange={(e) => handleNameChange(index, e.target.value)}
                className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none text-gray-800"
                placeholder={`Player ${index + 1}`}
              />
            ))}
          </div>
        </div>

        <div className="mb-8 bg-green-50 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2 text-gray-700">
            Starting Money: ${INITIAL_MONEY.toLocaleString()}
          </h2>
          <div className="text-sm text-gray-600 space-y-1">
            {Object.entries(MONEY_BREAKDOWN).map(([value, count]) => (
              <div key={value} className="flex justify-between">
                <span>
                  ${value} ×{count}
                </span>
                <span className="font-semibold">
                  ${(parseInt(value) * count).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleStartGame}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-lg transition-colors shadow-lg text-lg"
        >
          Start Game
        </button>
      </div>
    </div>
  );
}
