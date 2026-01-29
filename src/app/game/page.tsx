"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GameState, Player } from "@/types/game";

export default function Game() {
  const router = useRouter();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionFrom, setTransactionFrom] = useState<Player | null>(null);
  const [transactionTo, setTransactionTo] = useState<Player | null>(null);
  const [amount, setAmount] = useState("");

  useEffect(() => {
    const savedGame = localStorage.getItem("monopoly-game");
    if (savedGame) {
      setGameState(JSON.parse(savedGame));
    } else {
      router.push("/setup");
    }
  }, [router]);

  const saveGameState = (newState: GameState) => {
    setGameState(newState);
    localStorage.setItem("monopoly-game", JSON.stringify(newState));
  };

  const openTransactionModal = (from: Player, to: Player) => {
    setTransactionFrom(from);
    setTransactionTo(to);
    setAmount("");
    setShowTransactionModal(true);
  };

  const handleTransaction = () => {
    if (!gameState || !transactionFrom || !transactionTo || !amount) return;

    const amountNum = parseInt(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    if (!transactionFrom.isBank && transactionFrom.balance < amountNum) {
      alert("Insufficient balance");
      return;
    }

    const newPlayers = gameState.players.map((player) => {
      if (player.id === transactionFrom.id) {
        return { ...player, balance: player.balance - amountNum };
      }
      if (player.id === transactionTo.id) {
        return { ...player, balance: player.balance + amountNum };
      }
      return player;
    });

    let newBank = gameState.bank;
    if (transactionFrom.isBank) {
      newBank = { ...newBank, balance: newBank.balance - amountNum };
    }
    if (transactionTo.isBank) {
      newBank = { ...newBank, balance: newBank.balance + amountNum };
    }

    const newTransaction = {
      from: transactionFrom.id,
      to: transactionTo.id,
      amount: amountNum,
      timestamp: Date.now(),
    };

    saveGameState({
      ...gameState,
      players: newPlayers,
      bank: newBank,
      transactions: [...gameState.transactions, newTransaction],
    });

    setShowTransactionModal(false);
    setAmount("");
  };

  if (!gameState) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 to-emerald-900 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">Monopoly Money</h1>
          <button
            onClick={() => router.push("/setup")}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold"
          >
            New Game
          </button>
        </div>

        {/* Bank */}
        <div className="bg-yellow-400 rounded-xl shadow-2xl p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">🏦 Bank</h2>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                ${gameState.bank.balance.toLocaleString()}
              </p>
            </div>
            <div className="space-y-2">
              {gameState.players.map((player) => (
                <button
                  key={player.id}
                  onClick={() => openTransactionModal(gameState.bank, player)}
                  className="block bg-white hover:bg-gray-100 text-gray-800 px-4 py-2 rounded-lg font-semibold text-sm w-full"
                >
                  Send to {player.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Players */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {gameState.players.map((player) => (
            <div key={player.id} className="bg-white rounded-xl shadow-xl p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                {player.name}
              </h3>
              <p className="text-2xl font-bold text-green-600 mb-4">
                ${player.balance.toLocaleString()}
              </p>

              <div className="space-y-2">
                <button
                  onClick={() => openTransactionModal(player, gameState.bank)}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-semibold text-sm"
                >
                  Pay Bank
                </button>

                <details className="bg-gray-50 rounded-lg">
                  <summary className="cursor-pointer px-4 py-2 font-semibold text-gray-700 hover:bg-gray-100 rounded-lg">
                    Send to Player
                  </summary>
                  <div className="p-2 space-y-1">
                    {gameState.players
                      .filter((p) => p.id !== player.id)
                      .map((targetPlayer) => (
                        <button
                          key={targetPlayer.id}
                          onClick={() =>
                            openTransactionModal(player, targetPlayer)
                          }
                          className="block w-full text-left bg-white hover:bg-green-50 text-gray-800 px-3 py-2 rounded-lg text-sm"
                        >
                          → {targetPlayer.name}
                        </button>
                      ))}
                  </div>
                </details>
              </div>
            </div>
          ))}
        </div>

        {/* Transaction History */}
        <div className="mt-6 bg-white rounded-xl shadow-xl p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            Recent Transactions
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {gameState.transactions
              .slice(-10)
              .reverse()
              .map((transaction, index) => {
                const fromName =
                  transaction.from === -1
                    ? "Bank"
                    : gameState.players.find((p) => p.id === transaction.from)
                        ?.name;
                const toName =
                  transaction.to === -1
                    ? "Bank"
                    : gameState.players.find((p) => p.id === transaction.to)
                        ?.name;

                return (
                  <div
                    key={index}
                    className="flex justify-between items-center bg-gray-50 p-3 rounded-lg text-sm"
                  >
                    <span className="text-gray-700">
                      <span className="font-semibold">{fromName}</span> →{" "}
                      <span className="font-semibold">{toName}</span>
                    </span>
                    <span className="font-bold text-green-600">
                      ${transaction.amount.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            {gameState.transactions.length === 0 && (
              <p className="text-gray-500 text-center py-4">
                No transactions yet
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Transaction Modal */}
      {showTransactionModal && transactionFrom && transactionTo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Send Money
            </h2>

            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">From:</span>
                <span className="font-bold text-gray-800">
                  {transactionFrom.name}
                </span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Balance:</span>
                <span className="font-bold text-green-600">
                  ${transactionFrom.balance.toLocaleString()}
                </span>
              </div>
              <div className="border-t border-gray-300 my-2"></div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">To:</span>
                <span className="font-bold text-gray-800">
                  {transactionTo.name}
                </span>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-2">
                Amount
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none text-gray-800 text-lg"
                placeholder="Enter amount"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowTransactionModal(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleTransaction}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
