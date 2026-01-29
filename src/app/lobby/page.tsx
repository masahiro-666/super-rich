"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";

let socket: Socket;

export default function Lobby() {
  const router = useRouter();
  const [mode, setMode] = useState<"select" | "create" | "join">("select");
  const [hostName, setHostName] = useState("");
  const [playerCount, setPlayerCount] = useState(2);
  const [roomCode, setRoomCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [error, setError] = useState("");

  const initSocket = () => {
    if (!socket) {
      socket = io();
    }
    return socket;
  };

  const handleCreateGame = () => {
    const socket = initSocket();

    const bankerName = "Banker";
    socket.emit("create-game", { hostName: bankerName, playerCount });

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

    const socket = initSocket();

    socket.emit("join-game", { roomCode: roomCode.toUpperCase(), playerName });

    socket.once("joined-game", ({ gameState, playerId }) => {
      localStorage.setItem("monopoly-role", "player");
      localStorage.setItem("monopoly-room", roomCode.toUpperCase());
      localStorage.setItem("monopoly-player-id", playerId);
      localStorage.setItem("monopoly-name", playerName);
      router.push("/player");
    });

    socket.on("error", ({ message }) => {
      setError(message);
    });
  };

  if (mode === "select") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-600 to-emerald-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <h1 className="text-4xl font-bold text-center mb-2 text-gray-800">
            Monopoly Money
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

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Number of Players
              </label>
              <div className="flex gap-2 flex-wrap">
                {[2, 3, 4, 5, 6].map((count) => (
                  <button
                    key={count}
                    onClick={() => setPlayerCount(count)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      playerCount === count
                        ? "bg-green-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleCreateGame}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-lg transition-colors shadow-lg text-lg mt-6"
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
            setError("");
          }}
          className="mb-4 text-gray-600 hover:text-gray-800"
        >
          ← Back
        </button>

        <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">
          Join Game
        </h1>
        <p className="text-center text-gray-600 mb-6">
          Enter the room code to join
        </p>

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
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-gray-800 text-center text-2xl font-mono tracking-wider uppercase"
              placeholder="XXXXXX"
              maxLength={6}
            />
          </div>

          <button
            onClick={handleJoinGame}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg transition-colors shadow-lg text-lg mt-6"
          >
            Join Game
          </button>
        </div>
      </div>
    </div>
  );
}
