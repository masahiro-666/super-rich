"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { io, Socket } from "socket.io-client";

let socket: Socket;

export default function Lobby() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomParam = searchParams?.get("room");

  const [mode, setMode] = useState<"select" | "create" | "join">(
    roomParam ? "join" : "select",
  );
  const [hostName, setHostName] = useState("");
  const [roomCode, setRoomCode] = useState(roomParam?.toUpperCase() || "");
  const [playerName, setPlayerName] = useState("");
  const [error, setError] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [startingMoney, setStartingMoney] = useState(15000);
  const [deedCardsPerPlayer, setDeedCardsPerPlayer] = useState(2);

  const initSocket = () => {
    if (!socket) {
      socket = io();
    }
    return socket;
  };

  const handleCreateGame = () => {
    const socket = initSocket();

    const bankerName = "Banker";
    socket.emit("create-game", {
      hostName: bankerName,
      settings: {
        startingMoney,
        deedCardsPerPlayer,
      },
    });

    socket.once("game-created", ({ roomCode, gameState }) => {
      localStorage.setItem("monopoly-role", "host");
      localStorage.setItem("monopoly-room", roomCode);
      localStorage.setItem("monopoly-name", bankerName);
      router.push("/host");
    });

    socket.on("error", ({ message }) => {
      setError(message);
    });
  };

  const handleJoinGame = () => {
    if (!playerName.trim()) {
      setError("Please enter your name");
      return;
    }

    if (!roomCode.trim()) {
      setError("Please enter room code");
      return;
    }

    setIsJoining(true);
    setError("");

    const socket = initSocket();

    socket.emit("join-game", {
      roomCode: roomCode.toUpperCase(),
      playerName: playerName.trim(),
    });

    socket.once("joined-game", ({ gameState, playerId }) => {
      console.log("joined-game received:", { gameState, playerId });
      const player = gameState.players.find((p) => p.id === playerId);

      if (!player) {
        setError("Failed to join game. Please try again.");
        setIsJoining(false);
        return;
      }

      localStorage.setItem("monopoly-role", "player");
      localStorage.setItem("monopoly-room", roomCode.toUpperCase());
      localStorage.setItem("monopoly-player-id", playerId);
      localStorage.setItem("monopoly-name", player.name);

      router.push("/player");
    });

    socket.on("error", ({ message }) => {
      setError(message);
      setIsJoining(false);
    });
  };

  if (mode === "select") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-600 to-emerald-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <h1 className="text-4xl font-bold text-center mb-2 text-gray-800">
            Super Rich
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Multiplayer Banking System
          </p>

          <div className="space-y-4">
            <button
              onClick={() => setMode("create")}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-lg transition-colors shadow-lg text-lg"
            >
              🏦 Host New Game
            </button>

            <button
              onClick={() => setMode("join")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg transition-colors shadow-lg text-lg"
            >
              👤 Join Game
            </button>
          </div>

          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-2">How it works:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Host creates a game and gets a room code</li>
              <li>• Players join using the room code</li>
              <li>• Each player uses their own device</li>
              <li>• Host can manage the bank</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "create") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-600 to-emerald-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <button
            onClick={() => {
              setMode("select");
              setError("");
            }}
            className="mb-4 text-gray-600 hover:text-gray-800"
          >
            ← Back
          </button>

          <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">
            Host New Game
          </h1>
          <p className="text-center text-gray-600 mb-6">
            You will be the Banker
          </p>
          <p className="text-center text-gray-500 text-sm mb-6">
            Players can join your game (2-6 players)
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-4 mb-6">
            {/* Starting Money */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Starting Money
              </label>
              <input
                type="number"
                value={startingMoney}
                onChange={(e) =>
                  setStartingMoney(parseInt(e.target.value) || 0)
                }
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none text-gray-900 font-semibold"
                min="0"
                step="100"
              />
              <p className="text-xs text-gray-500 mt-1">
                Amount each player starts with
              </p>
            </div>

            {/* Deed Cards Per Player */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Deed Cards Per Player
              </label>
              <input
                type="number"
                value={deedCardsPerPlayer}
                onChange={(e) =>
                  setDeedCardsPerPlayer(parseInt(e.target.value) || 0)
                }
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none text-gray-900 font-semibold"
                min="0"
                max="10"
              />
              <p className="text-xs text-gray-500 mt-1">
                Random deed cards given to each player
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleCreateGame}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-lg transition-colors shadow-lg text-lg"
            >
              Create Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Join mode
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-cyan-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <button
          onClick={() => {
            setMode("select");
            setRoomCode("");
            setError("");
          }}
          className="mb-4 text-gray-600 hover:text-gray-800"
        >
          ← Back
        </button>

        <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">
          Join Game
        </h1>
        {roomCode ? (
          <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4 mb-6">
            <p className="text-sm text-gray-600 text-center mb-2">
              Joining Room:
            </p>
            <p className="font-mono text-3xl font-bold text-green-600 text-center">
              {roomCode}
            </p>
          </div>
        ) : (
          <p className="text-center text-gray-600 mb-6">
            Enter the room code to join
          </p>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Your Name
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-gray-800"
              placeholder="Enter your name"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Room Code
            </label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-gray-800 text-center text-2xl font-mono tracking-wider uppercase disabled:bg-gray-100"
              placeholder="XXXXXX"
              maxLength={6}
              disabled={!!roomParam}
            />
            {roomParam && (
              <p className="text-xs text-gray-500 mt-1 text-center">
                Room code from QR code
              </p>
            )}
          </div>

          <button
            onClick={handleJoinGame}
            disabled={isJoining}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-4 rounded-lg transition-colors shadow-lg text-lg mt-6"
          >
            {isJoining ? "Joining..." : "Join Game"}
          </button>
        </div>
      </div>
    </div>
  );
}
