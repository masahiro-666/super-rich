"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { GameState } from "@/types/game";
import { INITIAL_MONEY, MONEY_BREAKDOWN, DEED_CARDS } from "@/types/game";

let socket: Socket;

export default function Host() {
  const router = useRouter();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [roomCode, setRoomCode] = useState("");
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [amount, setAmount] = useState("");
  const [transactionType, setTransactionType] = useState<"send" | "receive">(
    "send",
  );
  const [showCopyTooltip, setShowCopyTooltip] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [showLandCards, setShowLandCards] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [startingMoney, setStartingMoney] = useState(15000);
  const [deedCardsPerPlayer, setDeedCardsPerPlayer] = useState(2);
  const [deedSearchQuery, setDeedSearchQuery] = useState("");
  const [showGiveDeedModal, setShowGiveDeedModal] = useState(false);
  const [selectedDeedToGive, setSelectedDeedToGive] = useState<any>(null);
  const [selectedPlayerForDeed, setSelectedPlayerForDeed] = useState("");
  const [showConfirmTransaction, setShowConfirmTransaction] = useState(false);
  const [pendingTransactionTarget, setPendingTransactionTarget] = useState<{
    playerId: string;
    playerName: string;
    type: "send" | "receive";
  } | null>(null);
  const [amountHistory, setAmountHistory] = useState<number[]>([]);

  useEffect(() => {
    const role = localStorage.getItem("monopoly-role");
    const savedRoomCode = localStorage.getItem("monopoly-room");

    if (role !== "host" || !savedRoomCode) {
      router.push("/lobby");
      return;
    }

    setRoomCode(savedRoomCode);

    if (!socket || !socket.connected) {
      socket = io();
    }

    socket.on("connect", () => {
      console.log("Host connected, rejoining room:", savedRoomCode);
      socket.emit("rejoin-as-host", { roomCode: savedRoomCode });
    });

    // If already connected, rejoin immediately
    if (socket.connected) {
      console.log("Socket already connected, rejoining room:", savedRoomCode);
      socket.emit("rejoin-as-host", { roomCode: savedRoomCode });
    }

    socket.on("game-created", ({ gameState }) => {
      console.log("Game state received:", gameState);
      setGameState(gameState);
      setStartingMoney(gameState.settings?.startingMoney || 15000);
      setDeedCardsPerPlayer(gameState.settings?.deedCardsPerPlayer || 2);
    });

    socket.on("player-joined", ({ gameState }) => {
      setGameState(gameState);
    });

    socket.on("player-left", ({ gameState }) => {
      setGameState(gameState);
    });

    socket.on("game-updated", ({ gameState }) => {
      setGameState(gameState);
    });

    socket.on("game-started", ({ gameState }) => {
      setGameState(gameState);
    });

    socket.on("settings-updated", ({ gameState }) => {
      setGameState(gameState);
      setStartingMoney(gameState.settings?.startingMoney || 15000);
      setDeedCardsPerPlayer(gameState.settings?.deedCardsPerPlayer || 2);
    });

    socket.on("deed-request-created", ({ gameState }) => {
      setGameState(gameState);
    });

    socket.on("error", ({ message }) => {
      console.error("Socket error:", message);

      // If game not found, clear localStorage and redirect to lobby
      if (message === "Game not found") {
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
      if (socket) {
        socket.off("connect");
        socket.off("game-created");
        socket.off("player-joined");
        socket.off("player-left");
        socket.off("game-updated");
        socket.off("game-started");
        socket.off("settings-updated");
        socket.off("deed-request-created");
        socket.off("error");
      }
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
  const handleStartGame = () => {
    if (!gameState || gameState.players.length === 0) {
      setWarningMessage(
        "Please wait for players to join before starting the game",
      );
      setShowWarning(true);
      return;
    }
    socket.emit("start-game", { roomCode });
  };

  const handleColorChange = (playerId: string, color: string) => {
    socket.emit("update-player-color", { roomCode, playerId, color });
  };

  const handleUpdateSettings = () => {
    socket.emit("update-settings", {
      roomCode,
      settings: {
        startingMoney,
        deedCardsPerPlayer,
      },
    });
    setShowSettings(false);
  };

  const openTransactionModal = (playerId: string, type: "send" | "receive") => {
    const player = gameState?.players.find(p => p.id === playerId);
    if (!player) return;
    
    setPendingTransactionTarget({
      playerId: playerId,
      playerName: player.name,
      type: type
    });
    setShowConfirmTransaction(true);
  };

  const confirmTransaction = () => {
    if (!pendingTransactionTarget) return;
    
    setSelectedPlayerId(pendingTransactionTarget.playerId);
    setTransactionType(pendingTransactionTarget.type);
    setAmount("0");
    setAmountHistory([]);
    setShowConfirmTransaction(false);
    setShowTransactionModal(true);
  };

  const handleTransaction = () => {
    if (!amount || !selectedPlayerId) return;

    const amountNum = parseInt(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setWarningMessage("Please enter a valid amount");
      setShowWarning(true);
      return;
    }

    const fromId = transactionType === "send" ? "bank" : selectedPlayerId;
    const toId = transactionType === "send" ? selectedPlayerId : "bank";

    socket.emit("transaction", {
      roomCode,
      fromId,
      toId,
      amount: amountNum,
    });

    setShowTransactionModal(false);
    setAmount("");
  };

  const handleNewGame = () => {
    localStorage.clear();
    if (socket) socket.disconnect();
    router.push("/lobby");
  };

  const handleCopyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setShowCopyTooltip(true);
    setTimeout(() => {
      setShowCopyTooltip(false);
    }, 2000);
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
        {/* Header */}
        <div className="bg-white rounded-xl shadow-xl p-6 mb-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">🏦 Bank Host</h1>
              <div className="flex items-center gap-3 mt-2">
                <div>
                  <p className="text-gray-600 text-sm">Room Code:</p>
                  <p className="font-mono text-2xl font-bold text-green-600">
                    {roomCode}
                  </p>
                </div>
                {gameState?.started && (
                  <div className="ml-4 pl-4 border-l-2 border-gray-300">
                    <p className="text-gray-600 text-sm">Game Time:</p>
                    <p className="font-mono text-xl font-bold text-blue-600">
                      ⏱️ {formatTime(elapsedTime)}
                    </p>
                  </div>
                )}
                <div className="relative">
                  <button
                    onClick={handleCopyRoomCode}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors flex items-center gap-2"
                    title="Copy room code"
                  >
                    📋 Copy
                  </button>
                  {showCopyTooltip && (
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-gray-800 text-white px-3 py-1 rounded text-sm whitespace-nowrap animate-fade-in">
                      Copied!
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {!gameState.started && (
                <button
                  onClick={() => setShowSettings(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold"
                >
                  ⚙️ Settings
                </button>
              )}
              <button
                onClick={() => setShowLandCards(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold"
              >
                📜 Deed Cards
              </button>
              <button
                onClick={handleNewGame}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold"
              >
                End Game
              </button>
            </div>
          </div>
        </div>

        {!gameState.started && (
          <>
            <div className="bg-yellow-100 border-2 border-yellow-400 rounded-xl p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                Waiting for Players...
              </h2>
              <p className="text-gray-700 mb-4">
                {gameState.players.length} player
                {gameState.players.length !== 1 ? "s" : ""} joined (min: 2, max:
                6)
              </p>
              {gameState.players.length > 0 && (
                <div className="space-y-2">
                  <p className="font-semibold text-gray-700 text-sm">
                    Current players:
                  </p>
                  {gameState.players.map((player, index) => (
                    <div
                      key={player.id}
                      className="flex items-center bg-white p-2 rounded"
                    >
                      <span className="font-semibold text-gray-800">
                        {index + 1}. {player.name}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleStartGame}
              disabled={gameState.players.length < 2}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-6 px-8 rounded-xl transition-colors shadow-2xl text-2xl mb-6"
            >
              🎮 Start Game{" "}
              {gameState.players.length >= 2 &&
                `(${gameState.players.length} players)`}
            </button>
          </>
        )}

        {/* Bank Balance */}
        <div className="bg-yellow-400 rounded-xl shadow-2xl p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Bank Balance
          </h2>
          <p className="text-4xl font-bold text-gray-900">
            ${gameState.bank.balance.toLocaleString()}
          </p>
        </div>

        {/* Players */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {gameState.players.map((player) => (
            <div
              key={player.id}
              className="bg-white rounded-xl shadow-xl p-6 transition-all duration-300"
              style={
                player.color
                  ? {
                      border: `4px solid ${player.color}`,
                      boxShadow: `0 0 20px ${player.color}40`,
                    }
                  : {}
              }
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold text-gray-800">
                  {player.name}
                </h3>
                {player.color && (
                  <div
                    className="w-8 h-8 rounded-full border-2 border-gray-300"
                    style={{ backgroundColor: player.color }}
                  ></div>
                )}
              </div>

              {!gameState.started && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-gray-600">Select Color:</p>
                    {player.color && (
                      <button
                        onClick={() => handleColorChange(player.id, "")}
                        className="text-xs text-red-600 hover:text-red-700 font-semibold"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      "#EC4899",
                      "#FFFFFF",
                      "#000000",
                      "#EF4444",
                      "#10B981",
                      "#3B82F6",
                    ].map((color, idx) => {
                      const colorNames = [
                        "pink",
                        "white",
                        "black",
                        "red",
                        "green",
                        "blue",
                      ];
                      const isUsedByOther = gameState.players.some(
                        (p) => p.color === color && p.id !== player.id,
                      );
                      const isSelected = player.color === color;
                      const shouldFade = player.color && !isSelected;
                      return (
                        <button
                          key={color}
                          onClick={() => handleColorChange(player.id, color)}
                          disabled={isUsedByOther}
                          className={`w-10 h-10 rounded-full transition-all ${
                            isSelected
                              ? "ring-4 ring-offset-2 scale-110"
                              : isUsedByOther
                                ? "opacity-30 cursor-not-allowed"
                                : shouldFade
                                  ? "opacity-30 hover:opacity-100 hover:scale-105"
                                  : "hover:scale-105 hover:ring-2 hover:ring-offset-1"
                          }`}
                          style={{
                            backgroundColor: color,
                            ringColor: isSelected
                              ? color === "#FFFFFF"
                                ? "#000000"
                                : color
                              : "transparent",
                            border:
                              color === "#FFFFFF"
                                ? "2px solid #E5E7EB"
                                : "none",
                          }}
                          title={
                            isUsedByOther
                              ? `${colorNames[idx]} (taken)`
                              : colorNames[idx]
                          }
                        ></button>
                      );
                    })}
                  </div>
                </div>
              )}

              <p className="text-2xl font-bold text-green-600 mb-2">
                ${player.balance.toLocaleString()}
              </p>

              {gameState.started && (
                <p className="text-sm text-gray-600 mb-4">
                  📜 Deeds: {player.deedCards?.length || 0}
                </p>
              )}

              {gameState.started && (
                <div className="flex gap-2">
                  <button
                    onClick={() => openTransactionModal(player.id, "send")}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg font-semibold text-sm"
                  >
                    Send $
                  </button>
                  <button
                    onClick={() => openTransactionModal(player.id, "receive")}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-semibold text-sm"
                  >
                    Receive $
                  </button>
                </div>
              )}
            </div>
          ))}

          {gameState.players.length === 0 && (
            <div className="col-span-full text-center py-12 text-white">
              <p className="text-xl">
                No players yet. Share the room code:{" "}
                <span className="font-bold text-2xl">{roomCode}</span>
              </p>
            </div>
          )}
        </div>

        {/* Deed Requests */}
        {gameState.started &&
          gameState.deedRequests &&
          gameState.deedRequests.length > 0 && (
            <div className="bg-white rounded-xl shadow-xl p-6 mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                📋 Pending Deed Requests
              </h3>
              <div className="space-y-3">
                {gameState.deedRequests.map((request) => (
                  <div
                    key={request.id}
                    className="border-2 border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-gray-800">
                          {request.playerName}
                        </p>
                        <p className="text-sm text-gray-600">
                          Wants to{" "}
                          <span className="font-semibold">{request.type}</span>:{" "}
                          {request.deedCard.name}
                        </p>
                        <p className="text-lg font-bold text-green-600">
                          ${request.deedCard.price.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => {
                          socket.emit("confirm-deed-request", {
                            roomCode,
                            requestId: request.id,
                            approved: true,
                          });
                        }}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg"
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => {
                          socket.emit("confirm-deed-request", {
                            roomCode,
                            requestId: request.id,
                            approved: false,
                          });
                        }}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg"
                      >
                        ✗ Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Available Deeds - Bank can give to players */}
        {gameState.started && (
          <div className="bg-white rounded-xl shadow-xl p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              🏪 Available Deeds ({gameState.availableDeeds?.length || 0})
            </h3>
            {gameState.availableDeeds && gameState.availableDeeds.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                {gameState.availableDeeds.map((deed) => (
                  <div
                    key={deed.id}
                    className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-gray-200 rounded-lg p-3"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-gray-500 bg-white px-2 py-1 rounded">
                        #{deed.id}
                      </span>
                      <span className="text-sm font-bold text-green-600">
                        ${deed.price.toLocaleString()}
                      </span>
                    </div>
                    <h4 className="font-bold text-gray-800 text-sm mb-2">
                      {deed.name}
                    </h4>
                    <button
                      onClick={() => {
                        setSelectedDeedToGive(deed);
                        setShowGiveDeedModal(true);
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 rounded transition-colors"
                    >
                      Give to Player
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                All deeds have been distributed
              </p>
            )}
          </div>
        )}

        {/* Transaction History */}
        {gameState.started && (
          <div className="bg-white rounded-xl shadow-xl p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              💰 Money Transactions
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {gameState.transactions
                .slice(-20)
                .reverse()
                .map((transaction, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center bg-gray-50 p-3 rounded-lg text-sm"
                  >
                    <span className="text-gray-700">
                      <span className="font-semibold">
                        {transaction.fromName}
                      </span>{" "}
                      →{" "}
                      <span className="font-semibold">
                        {transaction.toName}
                      </span>
                    </span>
                    <span className="font-bold text-green-600">
                      ${transaction.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              {gameState.transactions.length === 0 && (
                <p className="text-gray-500 text-center py-4">
                  No transactions yet
                </p>
              )}
            </div>
          </div>
        )}

        {/* Deed Transaction History */}
        {gameState.started && gameState.deedTransactions && (
          <div className="bg-white rounded-xl shadow-xl p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              📜 Deed Transactions
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {gameState.deedTransactions
                .slice(-20)
                .reverse()
                .map((transaction, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg text-sm ${
                      transaction.type === "buy"
                        ? "bg-green-50 border-l-4 border-green-500"
                        : transaction.type === "sell"
                          ? "bg-red-50 border-l-4 border-red-500"
                          : "bg-blue-50 border-l-4 border-blue-500"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-semibold text-gray-800">
                          {transaction.playerName}
                        </span>
                        <span className="text-gray-600">
                          {transaction.type === "buy"
                            ? " bought "
                            : transaction.type === "sell"
                              ? " sold "
                              : " received "}
                        </span>
                        <span className="font-semibold text-gray-800">
                          {transaction.deedCard.name}
                        </span>
                        {transaction.type !== "give" && (
                          <span className="text-gray-600">
                            {transaction.type === "buy"
                              ? " from Bank"
                              : " to Bank"}
                          </span>
                        )}
                      </div>
                      {transaction.price > 0 && (
                        <span
                          className={`font-bold ${
                            transaction.type === "buy"
                              ? "text-red-600"
                              : "text-green-600"
                          }`}
                        >
                          {transaction.type === "buy" ? "-" : "+"}$
                          {transaction.price.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              {gameState.deedTransactions.length === 0 && (
                <p className="text-gray-500 text-center py-4">
                  No deed transactions yet
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Confirm Transaction Modal */}
      {showConfirmTransaction && pendingTransactionTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-md w-full text-center animate-scale-in">
            <div className="text-6xl mb-4">💸</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              {pendingTransactionTarget.type === "send" ? "Send Money?" : "Receive Money?"}
            </h2>
            <p className="text-lg text-gray-700 mb-2">
              {pendingTransactionTarget.type === "send" 
                ? "Do you want to send money to" 
                : "Do you want to receive money from"}
            </p>
            <p className="text-2xl font-bold text-blue-600 mb-6">
              {pendingTransactionTarget.playerName}?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirmTransaction(false);
                  setPendingTransactionTarget(null);
                }}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-6 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmTransaction}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      {showTransactionModal && selectedPlayerId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {transactionType === "send"
                ? "Send Money to Player"
                : "Receive Money from Player"}
            </h2>

            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Player:</span>
                <span className="font-bold text-gray-800">
                  {
                    gameState.players.find((p) => p.id === selectedPlayerId)
                      ?.name
                  }
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Balance:</span>
                <span className="font-bold text-green-600">
                  $
                  {gameState.players
                    .find((p) => p.id === selectedPlayerId)
                    ?.balance.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-2">
                Select Bill Amount
              </label>
              <div className="grid grid-cols-3 gap-3 mb-3">
                {[10, 50, 100, 500, 1000, 5000].map((bill) => {
                  const currentAmount = parseInt(amount) || 0;
                  const newAmount = currentAmount + bill;
                  const player = gameState.players.find((p) => p.id === selectedPlayerId);
                  const isDisabled = transactionType === "receive" && player && newAmount > player.balance;
                  
                  return (
                    <button
                      key={bill}
                      onClick={() => {
                        if (!isDisabled) {
                          const newTotal = currentAmount + bill;
                          setAmount(String(newTotal));
                          setAmountHistory([...amountHistory, bill]);
                        }
                      }}
                      disabled={isDisabled}
                      className={`px-4 py-3 rounded-lg font-bold transition-all ${
                        isDisabled
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-green-600 text-white hover:bg-green-700"
                      }`}
                    >
                      +${bill}
                    </button>
                  );
                })}
              </div>
              
              {/* Manual Input */}
              <div className="mb-3">
                <label className="block text-gray-600 text-sm mb-1">
                  Or enter amount (min: $10):
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => {
                    let val = parseInt(e.target.value) || 0;
                    // Round to nearest 10
                    val = Math.floor(val / 10) * 10;
                    if (val < 0) val = 0;
                    const player = gameState.players.find((p) => p.id === selectedPlayerId);
                    if (transactionType === "receive" && player && val > player.balance) {
                      val = player.balance;
                    }
                    setAmount(String(val));
                    setAmountHistory([]);
                  }}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none text-lg text-gray-900 font-semibold"
                  step="10"
                  min="0"
                />
              </div>

              <div className="flex gap-2 items-center justify-between">
                <div className="text-gray-600 text-sm">
                  Total Amount:
                </div>
                <div className="font-bold text-2xl text-green-600">
                  ${(parseInt(amount) || 0).toLocaleString()}
                </div>
              </div>
              
              {/* Undo Button */}
              {amountHistory.length > 0 && (
                <button
                  onClick={() => {
                    const lastAddition = amountHistory[amountHistory.length - 1];
                    const currentAmount = parseInt(amount) || 0;
                    setAmount(String(currentAmount - lastAddition));
                    setAmountHistory(amountHistory.slice(0, -1));
                  }}
                  className="w-full mt-3 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 rounded-lg transition-colors"
                >
                  ↶ Undo (Remove ${amountHistory[amountHistory.length - 1]})
                </button>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowTransactionModal(false);
                  setAmount("0");
                  setAmountHistory([]);
                }}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleTransaction}
                disabled={(parseInt(amount) || 0) < 10}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
              >
                {transactionType === "send" ? "Send" : "Receive"}
              </button>
            </div>
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
              }}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-xl transition-colors"
            >
              Close
            </button>
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

      {/* Deed Cards Modal */}
      {showLandCards && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-4xl w-full my-8 animate-scale-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-gray-800">
                📜 Deed Cards
              </h2>
              <button
                onClick={() => {
                  setShowLandCards(false);
                  setDeedSearchQuery("");
                }}
                className="text-gray-500 hover:text-gray-700 text-3xl"
              >
                ×
              </button>
            </div>

            {/* Search Bar */}
            <div className="mb-4">
              <input
                type="text"
                value={deedSearchQuery}
                onChange={(e) => setDeedSearchQuery(e.target.value)}
                placeholder="Search by name or number..."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none text-lg text-gray-900"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto">
              {DEED_CARDS.filter((card) => {
                const query = deedSearchQuery.toLowerCase();
                return (
                  card.name.toLowerCase().includes(query) ||
                  card.id.toString().includes(query)
                );
              }).map((card) => (
                <div
                  key={card.id}
                  className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-gray-500 bg-white px-2 py-1 rounded">
                      #{card.id}
                    </span>
                    <span className="text-lg font-bold text-green-600">
                      ${card.price.toLocaleString()}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">
                    {card.name}
                  </h3>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setShowLandCards(false);
                  setDeedSearchQuery("");
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-lg w-full animate-scale-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-gray-800">
                ⚙️ Game Settings
              </h2>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-500 hover:text-gray-700 text-3xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              {/* Starting Money */}
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">
                  Starting Money
                </label>
                <input
                  type="number"
                  value={startingMoney}
                  onChange={(e) =>
                    setStartingMoney(parseInt(e.target.value) || 0)
                  }
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none text-lg text-gray-900 font-semibold"
                  min="0"
                  step="100"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Amount of money each player starts with
                </p>
              </div>

              {/* Deed Cards Per Player */}
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">
                  Deed Cards Per Player
                </label>
                <input
                  type="number"
                  value={deedCardsPerPlayer}
                  onChange={(e) =>
                    setDeedCardsPerPlayer(parseInt(e.target.value) || 0)
                  }
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none text-lg text-gray-900 font-semibold"
                  min="0"
                  max="10"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Number of random deed cards distributed to each player
                </p>
              </div>

              {/* Current Settings Display */}
              {gameState && gameState.settings && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-700 mb-2">
                    Current Settings:
                  </h3>
                  <p className="text-sm text-gray-600">
                    Starting Money:{" "}
                    <span className="font-bold">
                      $
                      {(
                        gameState.settings.startingMoney || 15000
                      ).toLocaleString()}
                    </span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Deed Cards:{" "}
                    <span className="font-bold">
                      {gameState.settings.deedCardsPerPlayer || 2} per player
                    </span>
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3 justify-end">
              <button
                onClick={() => setShowSettings(false)}
                className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateSettings}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-xl transition-colors"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Give Deed Confirmation Modal */}
      {showGiveDeedModal && selectedDeedToGive && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full animate-scale-in">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              🏛️ Give Deed to Player
            </h2>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-xl p-4 mb-6">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-gray-500 bg-white px-2 py-1 rounded">
                  #{selectedDeedToGive.id}
                </span>
                <span className="text-lg font-bold text-green-600">
                  ${selectedDeedToGive.price.toLocaleString()}
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-800">
                {selectedDeedToGive.name}
              </h3>
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-2">
                Select Player:
              </label>
              <select
                value={selectedPlayerForDeed}
                onChange={(e) => setSelectedPlayerForDeed(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none text-lg text-gray-900 font-semibold"
              >
                <option value="">Choose a player...</option>
                {gameState?.players.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name} (Balance: ${player.balance.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowGiveDeedModal(false);
                  setSelectedDeedToGive(null);
                  setSelectedPlayerForDeed("");
                }}
                className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (selectedPlayerForDeed) {
                    socket.emit("bank-give-deed", {
                      roomCode,
                      playerId: selectedPlayerForDeed,
                      deedCard: selectedDeedToGive,
                    });
                    setShowGiveDeedModal(false);
                    setSelectedDeedToGive(null);
                    setSelectedPlayerForDeed("");
                  }
                }}
                disabled={!selectedPlayerForDeed}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl transition-colors"
              >
                Confirm Give
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
