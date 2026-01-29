"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { GameState, Player, DEED_CARDS } from "@/types/game";

let socket: Socket;

export default function PlayerView() {
  const router = useRouter();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [playerId, setPlayerId] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [amount, setAmount] = useState("");
  const [transactionType, setTransactionType] = useState<"player" | "bank">(
    "player",
  );
  const [showHostDisconnected, setShowHostDisconnected] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showMyDeeds, setShowMyDeeds] = useState(false);
  const [showAvailableDeeds, setShowAvailableDeeds] = useState(false);
  const [showAllDeeds, setShowAllDeeds] = useState(false);
  useEffect(() => {
    const role = localStorage.getItem("monopoly-role");
    const savedRoomCode = localStorage.getItem("monopoly-room");
    const savedPlayerName = localStorage.getItem("monopoly-name");

    if (role !== "player" || !savedRoomCode || !savedPlayerName) {
      router.push("/lobby");
      return;
    }

    setRoomCode(savedRoomCode);

    socket = io();

    socket.on("connect", () => {
      console.log("Player connected, rejoining room:", savedRoomCode);
      socket.emit("rejoin-as-player", {
        roomCode: savedRoomCode,
        playerName: savedPlayerName,
      });
    });

    socket.on("joined-game", ({ gameState, playerId }) => {
      console.log("Game state received:", gameState);
      setPlayerId(playerId);
      setGameState(gameState);
      const player = gameState.players.find((p) => p.id === playerId);
      setCurrentPlayer(player || null);
    });

    socket.on("player-joined", ({ gameState }) => {
      console.log("New player joined, updating game state");
      setGameState(gameState);
      const player = gameState.players.find((p) => p.id === socket.id);
      if (player) {
        setCurrentPlayer(player);
      }
    });

    socket.on("game-started", ({ gameState }) => {
      console.log("Game started!");
      setGameState(gameState);
      const player = gameState.players.find((p) => p.id === socket.id);
      setCurrentPlayer(player || null);
    });

    socket.on("game-updated", ({ gameState }) => {
      console.log("Game updated");
      setGameState(gameState);
      const player = gameState.players.find((p) => p.id === socket.id);
      setCurrentPlayer(player || null);
    });

    socket.on("deed-request-created", ({ gameState }) => {
      console.log("Deed request created");
      setGameState(gameState);
      const player = gameState.players.find((p) => p.id === socket.id);
      setCurrentPlayer(player || null);
    });

    socket.on("game-closed", ({ message }) => {
      setShowHostDisconnected(true);
      setTimeout(() => {
        localStorage.clear();
        router.push("/lobby");
      }, 3000);
    });

    socket.on("error", ({ message }) => {
      // If game not found or player not found, clear localStorage and redirect to lobby
      if (
        message === "Game not found" ||
        message.includes("Player not found")
      ) {
        localStorage.removeItem("monopoly-role");
        localStorage.removeItem("monopoly-room");
        localStorage.removeItem("monopoly-player-id");
        localStorage.removeItem("monopoly-name");
        router.push("/lobby");
        return;
      }

      setErrorMessage(message);
      setShowError(true);
    });

    return () => {
      if (socket) socket.disconnect();
    };
  }, [router]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameState?.started) {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    } else {
      setElapsedTime(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameState?.started]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const openTransactionModal = (targetId: string, type: "player" | "bank") => {
    setSelectedPlayerId(targetId);
    setTransactionType(type);
    setAmount("");
    setShowTransactionModal(true);
  };

  const handleTransaction = () => {
    if (!amount || !currentPlayer) return;

    const amountNum = parseInt(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setWarningMessage("Please enter a valid amount");
      setShowWarning(true);
      return;
    }

    if (currentPlayer.balance < amountNum) {
      setWarningMessage("Insufficient balance");
      setShowWarning(true);
      return;
    }

    const toId = transactionType === "bank" ? "bank" : selectedPlayerId;

    socket.emit("transaction", {
      roomCode,
      fromId: playerId,
      toId,
      amount: amountNum,
    });

    setShowTransactionModal(false);
    setAmount("");
  };

  const handleLeaveGame = () => {
    setShowLeaveConfirm(true);
  };

  const handleDeedRequest = (type: "buy" | "sell", deedCard: any) => {
    socket.emit("deed-request", {
      roomCode,
      type,
      deedCard,
    });
    setShowMyDeeds(false);
    setShowAvailableDeeds(false);
  };

  const confirmLeaveGame = () => {
    localStorage.clear();
    if (socket) socket.disconnect();
    router.push("/lobby");
  };

  if (!gameState || !currentPlayer) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <div
        className="min-h-screen p-4 transition-colors duration-500"
        style={{
          background: currentPlayer.color
            ? `linear-gradient(to bottom right, ${currentPlayer.color}40, ${currentPlayer.color}20)`
            : "linear-gradient(to bottom right, rgb(37, 99, 235), rgb(8, 145, 178))",
        }}
      >
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div
            className="bg-white rounded-xl shadow-xl p-6 mb-6 transition-all duration-500"
            style={
              currentPlayer.color
                ? { borderLeft: `8px solid ${currentPlayer.color}` }
                : {}
            }
          >
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div className="flex items-center gap-3">
                {currentPlayer.color && (
                  <div
                    className="w-12 h-12 rounded-full border-2 border-gray-300 animate-pulse"
                    style={{ backgroundColor: currentPlayer.color }}
                  ></div>
                )}
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">
                    {currentPlayer.name}
                  </h1>
                  <div className="flex items-center gap-3">
                    <p className="text-gray-600">
                      Room:{" "}
                      <span className="font-mono font-bold">{roomCode}</span>
                    </p>
                    {gameState.started && (
                      <span className="ml-2 pl-2 border-l-2 border-gray-300">
                        <span className="text-gray-600">Time: </span>
                        <span className="font-mono font-bold text-blue-600">
                          ⏱️ {formatTime(elapsedTime)}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={handleLeaveGame}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold"
              >
                Leave Game
              </button>
            </div>
          </div>

          {!gameState.started && (
            <div className="bg-yellow-100 border-2 border-yellow-400 rounded-xl p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                Waiting for game to start...
              </h2>
              <p className="text-gray-700 mb-4">
                {gameState.players.length} / {gameState.playerCount} players
                joined
              </p>
              <div className="space-y-2">
                <p className="font-semibold text-gray-700 text-sm">
                  {currentPlayer.color
                    ? "Your color has been assigned! 🎨"
                    : "Waiting for host to assign colors..."}
                </p>
                <p className="font-semibold text-gray-700 text-sm">
                  Players in lobby:
                </p>
                {gameState.players.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between bg-white p-2 rounded"
                    style={
                      player.color
                        ? { borderLeft: `4px solid ${player.color}` }
                        : {}
                    }
                  >
                    <div className="flex items-center gap-2">
                      {player.color && (
                        <div
                          className="w-6 h-6 rounded-full border border-gray-300"
                          style={{ backgroundColor: player.color }}
                        ></div>
                      )}
                      <span
                        className={`font-semibold ${player.id === socket?.id ? "text-green-600" : "text-gray-800"}`}
                      >
                        {player.name} {player.id === socket?.id && "(You)"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Player Balance */}
          <div
            className="rounded-xl shadow-2xl p-8 mb-6 text-white transition-all duration-500"
            style={{
              background: currentPlayer.color
                ? `linear-gradient(to bottom right, ${currentPlayer.color}, ${currentPlayer.color}E0)`
                : "linear-gradient(to bottom right, rgb(34, 197, 94), rgb(16, 185, 129))",
            }}
          >
            <h2 className="text-xl font-semibold mb-2 opacity-90">
              Your Balance
            </h2>
            <p className="text-5xl font-bold">
              ${currentPlayer.balance.toLocaleString()}
            </p>
          </div>

          {gameState.started && (
            <>
              {/* Deed Management */}
              <div className="bg-white rounded-xl shadow-xl p-6 mb-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  📜 Deed Cards
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setShowMyDeeds(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg transition-colors text-sm"
                  >
                    My Deeds ({currentPlayer.deedCards?.length || 0})
                  </button>
                  <button
                    onClick={() => setShowAvailableDeeds(true)}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-lg transition-colors text-sm"
                  >
                    Buy Deed ({gameState.availableDeeds?.length || 0})
                  </button>
                  <button
                    onClick={() => setShowAllDeeds(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-lg transition-colors text-sm"
                  >
                    All Deeds
                  </button>
                </div>
              </div>

              {/* Send Money Actions */}
              <div className="bg-white rounded-xl shadow-xl p-6 mb-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  Send Money
                </h3>

                <button
                  onClick={() => openTransactionModal("bank", "bank")}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-4 rounded-lg mb-3 transition-colors"
                >
                  💰 Pay Bank
                </button>

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-600 mb-2">
                    Send to Players:
                  </p>
                  {gameState.players
                    .filter((p) => p.id !== playerId)
                    .map((player) => (
                      <button
                        key={player.id}
                        onClick={() =>
                          openTransactionModal(player.id, "player")
                        }
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center px-4"
                      >
                        <span>→ {player.name}</span>
                      </button>
                    ))}
                </div>
              </div>

              {/* Other Players */}
              <div className="bg-white rounded-xl shadow-xl p-6 mb-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  Other Players
                </h3>
                <div className="space-y-2">
                  {gameState.players
                    .filter((p) => p.id !== playerId)
                    .map((player) => (
                      <div
                        key={player.id}
                        className="flex justify-between items-center bg-gray-50 p-3 rounded-lg"
                        style={
                          player.color
                            ? { borderLeft: `4px solid ${player.color}` }
                            : {}
                        }
                      >
                        <div className="flex items-center gap-2">
                          {player.color && (
                            <div
                              className="w-6 h-6 rounded-full border border-gray-300"
                              style={{ backgroundColor: player.color }}
                            ></div>
                          )}
                          <span className="font-semibold text-gray-800">
                            {player.name}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="bg-white rounded-xl shadow-xl p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  Recent Transactions
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {gameState.transactions
                    .filter((t) => t.from === playerId || t.to === playerId)
                    .slice(-10)
                    .reverse()
                    .map((transaction, index) => {
                      const isReceiving = transaction.to === playerId;
                      return (
                        <div
                          key={index}
                          className={`p-3 rounded-lg ${
                            isReceiving
                              ? "bg-green-50 border-l-4 border-green-500"
                              : "bg-red-50 border-l-4 border-red-500"
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-700">
                              {isReceiving ? (
                                <>
                                  Received from{" "}
                                  <span className="font-semibold">
                                    {transaction.fromName}
                                  </span>
                                </>
                              ) : (
                                <>
                                  Sent to{" "}
                                  <span className="font-semibold">
                                    {transaction.toName}
                                  </span>
                                </>
                              )}
                            </span>
                            <span
                              className={`font-bold ${isReceiving ? "text-green-600" : "text-red-600"}`}
                            >
                              {isReceiving ? "+" : "-"}$
                              {transaction.amount.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  {gameState.transactions.filter(
                    (t) => t.from === playerId || t.to === playerId,
                  ).length === 0 && (
                    <p className="text-gray-500 text-center py-4">
                      No transactions yet
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Transaction Modal */}
        {showTransactionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Send Money
              </h2>

              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">From:</span>
                  <span className="font-bold text-gray-800">
                    {currentPlayer.name}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Your Balance:</span>
                  <span className="font-bold text-green-600">
                    ${currentPlayer.balance.toLocaleString()}
                  </span>
                </div>
                <div className="border-t border-gray-300 my-2"></div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">To:</span>
                  <span className="font-bold text-gray-800">
                    {transactionType === "bank"
                      ? "Bank"
                      : gameState.players.find((p) => p.id === selectedPlayerId)
                          ?.name}
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 font-semibold mb-2">
                  Select Bill Amount
                </label>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {[10, 50, 100, 500, 1000, 5000].map((bill) => (
                    <button
                      key={bill}
                      onClick={() => setAmount(String(bill))}
                      className={`px-4 py-3 rounded-lg font-bold transition-all ${
                        amount === String(bill)
                          ? "bg-blue-600 text-white scale-105"
                          : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                      }`}
                    >
                      ${bill}
                    </button>
                  ))}
                </div>
                <div className="text-center text-gray-600 text-sm">
                  Selected:{" "}
                  <span className="font-bold text-lg text-blue-600">
                    ${amount || "0"}
                  </span>
                </div>
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
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Modal */}
      {showError && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-md w-full text-center animate-scale-in">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-3xl font-bold text-red-600 mb-4">Error</h2>
            <p className="text-lg text-gray-700 mb-6">{errorMessage}</p>
            <button
              onClick={() => {
                setShowError(false);
                setErrorMessage("");
                localStorage.clear();
                router.push("/lobby");
              }}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-xl transition-colors"
            >
              Return to Lobby
            </button>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showError && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-md w-full text-center animate-scale-in">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-3xl font-bold text-red-600 mb-4">Error</h2>
            <p className="text-lg text-gray-700 mb-6">{errorMessage}</p>
            <button
              onClick={() => {
                setShowError(false);
                setErrorMessage("");
                localStorage.clear();
                router.push("/lobby");
              }}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-xl transition-colors"
            >
              Return to Lobby
            </button>
          </div>
        </div>
      )}

      {/* Host Disconnected Modal */}
      {showHostDisconnected && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-md w-full text-center animate-scale-in">
            <div className="mb-6">
              <div className="text-6xl mb-4">🏦</div>
              <h2 className="text-3xl font-bold text-gray-800 mb-3">
                Game Ended
              </h2>
              <p className="text-lg text-gray-600 mb-2">
                The host has disconnected
              </p>
              <p className="text-sm text-gray-500">
                Returning to lobby in 3 seconds...
              </p>
            </div>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          </div>
        </div>
      )}

      {/* Warning Modal */}
      {showWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-md w-full text-center animate-scale-in">
            <div className="text-6xl mb-4">💡</div>
            <h2 className="text-3xl font-bold text-yellow-600 mb-4">Notice</h2>
            <p className="text-lg text-gray-700 mb-6">{warningMessage}</p>
            <button
              onClick={() => {
                setShowWarning(false);
                setWarningMessage("");
              }}
              className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-8 rounded-xl transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Leave Confirmation Modal */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-md w-full text-center animate-scale-in">
            <div className="text-6xl mb-4">👋</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Leave Game?
            </h2>
            <p className="text-lg text-gray-700 mb-6">
              Are you sure you want to leave the game?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-6 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmLeaveGame}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl transition-colors"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* My Deeds Modal */}
      {showMyDeeds && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-4xl w-full my-8 animate-scale-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-gray-800">
                📜 My Deed Cards
              </h2>
              <button
                onClick={() => setShowMyDeeds(false)}
                className="text-gray-500 hover:text-gray-700 text-3xl"
              >
                ×
              </button>
            </div>
            {currentPlayer.deedCards && currentPlayer.deedCards.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto">
                {currentPlayer.deedCards.map((card) => (
                  <div
                    key={card.id}
                    className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-gray-200 rounded-xl p-4"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-gray-500 bg-white px-2 py-1 rounded">
                        #{card.id}
                      </span>
                      <span className="text-lg font-bold text-green-600">
                        ${card.price.toLocaleString()}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-3">
                      {card.name}
                    </h3>
                    <button
                      onClick={() => handleDeedRequest("sell", card)}
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                    >
                      Sell to Bank
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="text-xl">You don't have any deed cards yet</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Available Deeds Modal */}
      {showAvailableDeeds && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-4xl w-full my-8 animate-scale-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-gray-800">
                🏪 Available Deed Cards
              </h2>
              <button
                onClick={() => setShowAvailableDeeds(false)}
                className="text-gray-500 hover:text-gray-700 text-3xl"
              >
                ×
              </button>
            </div>
            {gameState.availableDeeds && gameState.availableDeeds.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto">
                {gameState.availableDeeds.map((card) => (
                  <div
                    key={card.id}
                    className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-gray-200 rounded-xl p-4"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-gray-500 bg-white px-2 py-1 rounded">
                        #{card.id}
                      </span>
                      <span className="text-lg font-bold text-green-600">
                        ${card.price.toLocaleString()}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-3">
                      {card.name}
                    </h3>
                    <button
                      onClick={() => handleDeedRequest("buy", card)}
                      disabled={currentPlayer.balance < card.price}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition-colors"
                    >
                      {currentPlayer.balance < card.price
                        ? "Insufficient Funds"
                        : "Request to Buy"}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="text-xl">No deed cards available at the moment</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* All Deeds Modal */}
      {showAllDeeds && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-6xl w-full my-8 animate-scale-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-gray-800">
                🏘️ All Deed Cards ({DEED_CARDS.length})
              </h2>
              <button
                onClick={() => setShowAllDeeds(false)}
                className="text-gray-500 hover:text-gray-700 text-3xl"
              >
                ×
              </button>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-green-700">
                  {gameState.availableDeeds?.length || 0}
                </div>
                <div className="text-sm text-gray-600">Available</div>
              </div>
              {gameState.players.map((player) => (
                <div
                  key={player.id}
                  className={`bg-gradient-to-br rounded-xl p-4 text-center ${
                    player.id === currentPlayer.id
                      ? "from-blue-100 to-blue-200"
                      : "from-gray-100 to-gray-200"
                  }`}
                >
                  <div
                    className={`text-2xl font-bold ${
                      player.id === currentPlayer.id
                        ? "text-blue-700"
                        : "text-gray-700"
                    }`}
                  >
                    {player.deedCards?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600 truncate">
                    {player.name}{" "}
                    {player.id === currentPlayer.id ? "(You)" : ""}
                  </div>
                </div>
              ))}
            </div>

            {/* All Deeds Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto">
              {DEED_CARDS.map((card) => {
                // Find owner of this deed
                const owner = gameState.players.find((p) =>
                  p.deedCards?.some((d) => d.id === card.id),
                );
                const isAvailable = gameState.availableDeeds?.some(
                  (d) => d.id === card.id,
                );
                const isOwnedByMe = owner?.id === currentPlayer.id;

                return (
                  <div
                    key={card.id}
                    className={`border-2 rounded-xl p-4 ${
                      isOwnedByMe
                        ? "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300"
                        : isAvailable
                          ? "bg-gradient-to-br from-green-50 to-green-100 border-green-300"
                          : "bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-gray-500 bg-white px-2 py-1 rounded">
                        #{card.id}
                      </span>
                      <span className="text-lg font-bold text-green-600">
                        ${card.price.toLocaleString()}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">
                      {card.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      {isOwnedByMe ? (
                        <>
                          <span className="text-2xl">👤</span>
                          <span className="text-sm font-bold text-blue-700">
                            You own this
                          </span>
                        </>
                      ) : owner ? (
                        <>
                          <span className="text-2xl">👥</span>
                          <span className="text-sm font-bold text-gray-700">
                            Owned by {owner.name}
                          </span>
                        </>
                      ) : isAvailable ? (
                        <>
                          <span className="text-2xl">🏪</span>
                          <span className="text-sm font-bold text-green-700">
                            Available
                          </span>
                        </>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
