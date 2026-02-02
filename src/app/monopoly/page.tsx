"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { GameState, Player, DeedCard, ChanceCard, BoardSpace } from "@/types/game";
import MonopolyBoard from "@/components/MonopolyBoard";
import Dice from "@/components/Dice";
import PropertyModal from "@/components/PropertyModal";
import ChanceModal from "@/components/ChanceModal";

let socket: Socket;

export default function MonopolyGame() {
  const router = useRouter();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerId, setPlayerId] = useState<string>("");
  const [roomCode, setRoomCode] = useState<string>("");
  const [isHost, setIsHost] = useState(false);
  
  // Modals
  const [selectedProperty, setSelectedProperty] = useState<DeedCard | null>(null);
  const [canBuyProperty, setCanBuyProperty] = useState(false);
  const [chanceCard, setChanceCard] = useState<ChanceCard | null>(null);
  const [notification, setNotification] = useState<string>("");
  const [showTurnOrderRoll, setShowTurnOrderRoll] = useState(false);
  const [turnOrderResults, setTurnOrderResults] = useState<Array<{ name: string; roll: number }>>([]);

  useEffect(() => {
    const role = localStorage.getItem("monopoly-role");
    const room = localStorage.getItem("monopoly-room");
    const id = localStorage.getItem("monopoly-player-id");

    if (!role || !room) {
      router.push("/lobby");
      return;
    }

    setRoomCode(room);
    setIsHost(role === "host");
    if (id) setPlayerId(id);

    // Initialize socket
    socket = io();

    // Rejoin game
    if (role === "host") {
      socket.emit("rejoin-as-host", { roomCode: room });
    } else {
      const name = localStorage.getItem("monopoly-name");
      socket.emit("rejoin-as-player", { roomCode: room, playerName: name });
    }

    // Socket listeners
    socket.on("game-created", ({ gameState }) => {
      setGameState(gameState);
    });

    socket.on("joined-game", ({ gameState, playerId: pid }) => {
      setGameState(gameState);
      setPlayerId(pid);
    });

    socket.on("game-updated", ({ gameState }) => {
      setGameState(gameState);
    });

    socket.on("start-turn-order-roll", ({ gameState }) => {
      setGameState(gameState);
      setShowTurnOrderRoll(true);
      setTurnOrderResults([]);
    });

    socket.on("turn-order-rolled", ({ gameState, playerId: pid, playerName, dice, total }) => {
      setGameState(gameState);
      setTurnOrderResults(prev => [...prev, { name: playerName, roll: total }]);
      showNotification(`${playerName} ทอยได้ ${dice[0]} + ${dice[1]} = ${total}`);
    });

    socket.on("turn-order-complete", ({ gameState }) => {
      setGameState(gameState);
      setShowTurnOrderRoll(false);
      
      // Show final order
      const sortedPlayers = [...gameState.players].sort((a, b) => (a.turnOrder || 0) - (b.turnOrder || 0));
      const orderMsg = sortedPlayers.map(p => `${p.turnOrder}. ${p.name} (${p.turnOrderRoll})`).join('\n');
      showNotification(`ลำดับการเล่น:\n${orderMsg}\n\n${sortedPlayers[0].name} เริ่มเล่นก่อน!`);
    });

    socket.on("dice-rolled", ({ gameState, playerId: pid, dice, newPosition, spaceEffect }) => {
      setGameState(gameState);
      
      const player = gameState.players.find((p: Player) => p.id === pid);
      if (player) {
        showNotification(`${player.name} ทอยได้ ${dice[0]} + ${dice[1]} = ${dice[0] + dice[1]}`);
      }

      // Handle space effects
      if (spaceEffect) {
        if (spaceEffect.type === "chance") {
          setChanceCard(spaceEffect.card);
        } else if (spaceEffect.type === "property" && spaceEffect.canBuy && pid === playerId) {
          setSelectedProperty(spaceEffect.property);
          setCanBuyProperty(true);
        } else if (spaceEffect.type === "rent") {
          showNotification(
            `จ่ายค่าเช่า ฿${spaceEffect.rent} ให้ ${spaceEffect.ownerName}`
          );
        } else if (spaceEffect.type === "tax") {
          showNotification(`จ่ายภาษี ฿${spaceEffect.amount}`);
        } else if (spaceEffect.type === "jail") {
          showNotification("ไปคุก! ติดคุก 3 เทิร์น");
        }
      }
    });

    socket.on("property-bought", ({ gameState }) => {
      setGameState(gameState);
      setSelectedProperty(null);
      setCanBuyProperty(false);
    });

    socket.on("house-built", ({ gameState }) => {
      setGameState(gameState);
      showNotification("สร้างบ้านสำเร็จ!");
    });

    socket.on("hotel-built", ({ gameState }) => {
      setGameState(gameState);
      showNotification("สร้างโรงแรมสำเร็จ!");
    });

    socket.on("turn-ended", ({ gameState }) => {
      setGameState(gameState);
    });

    socket.on("error", ({ message }) => {
      showNotification(`ข้อผิดพลาด: ${message}`);
    });

    return () => {
      socket.off("game-created");
      socket.off("joined-game");
      socket.off("game-updated");
      socket.off("start-turn-order-roll");
      socket.off("turn-order-rolled");
      socket.off("turn-order-complete");
      socket.off("dice-rolled");
      socket.off("property-bought");
      socket.off("house-built");
      socket.off("hotel-built");
      socket.off("turn-ended");
      socket.off("error");
      socket.disconnect();
    };
  }, []);

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(""), 5000);
  };

  const handleRollForTurnOrder = () => {
    socket.emit("roll-for-turn-order", { roomCode });
  };

  const handleRollDice = (total: number, dice: number[]) => {
    socket.emit("roll-dice", { roomCode });
  };

  const handleBuyProperty = () => {
    if (selectedProperty) {
      socket.emit("buy-property", { roomCode, propertyId: selectedProperty.id });
    }
  };

  const handleBuildHouse = () => {
    if (selectedProperty) {
      socket.emit("build-house", { roomCode, propertyId: selectedProperty.id });
      setSelectedProperty(null);
    }
  };

  const handleBuildHotel = () => {
    if (selectedProperty) {
      socket.emit("build-hotel", { roomCode, propertyId: selectedProperty.id });
      setSelectedProperty(null);
    }
  };

  const handleEndTurn = () => {
    socket.emit("end-turn", { roomCode });
  };

  const handlePayJail = () => {
    socket.emit("pay-jail", { roomCode });
  };

  const handleSpaceClick = (space: BoardSpace) => {
    if (space.property) {
      const property = gameState?.properties?.find(p => p.id === space.property!.id);
      if (property) {
        setSelectedProperty(property);
        
        // Check if current player can build
        const currentPlayer = gameState?.players.find(p => p.id === playerId);
        setCanBuyProperty(
          !property.owner &&
          currentPlayer?.position === space.id &&
          gameState?.currentPlayerIndex === gameState.players.indexOf(currentPlayer)
        );
      }
    }
  };

  if (!gameState || !gameState.started) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-600 to-emerald-700 flex items-center justify-center">
        <div className="text-white text-2xl font-bold">
          Loading game...
        </div>
      </div>
    );
  }

  // Show turn order rolling screen
  if (gameState.waitingForTurnOrder) {
    const currentPlayer = gameState.players.find((p) => p.id === playerId);
    const hasRolled = gameState.playersRolledForOrder?.includes(playerId);

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
          <h1 className="text-4xl font-bold text-center text-gray-800 mb-4">
            🎲 กำหนดลำดับการเล่น
          </h1>
          <p className="text-center text-gray-600 mb-8">
            ทุกคนทอยลูกเต๋า คนที่ทอยได้มากที่สุดเล่นก่อน!
          </p>

          {/* Turn order results */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6 min-h-[200px]">
            {turnOrderResults.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                รอผู้เล่นทอยลูกเต๋า...
              </p>
            ) : (
              <div className="space-y-3">
                {turnOrderResults
                  .sort((a, b) => b.roll - a.roll)
                  .map((result, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center bg-white rounded-lg p-4 shadow"
                    >
                      <span className="font-semibold text-gray-800">
                        {result.name}
                      </span>
                      <span className="text-2xl font-bold text-green-600">
                        🎲 {result.roll}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Roll button */}
          {currentPlayer && !hasRolled && (
            <button
              onClick={handleRollForTurnOrder}
              className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-xl font-bold rounded-lg shadow-lg transition-all active:scale-95"
            >
              🎲 ทอยลูกเต๋า
            </button>
          )}

          {hasRolled && (
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-700">
                ✅ คุณทอยแล้ว! รอผู้เล่นคนอื่น...
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {gameState.playersRolledForOrder?.length}/{gameState.players.length} คน
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const currentPlayer = gameState.players.find((p) => p.id === playerId);
  const isMyTurn =
    currentPlayer &&
    gameState.currentPlayerIndex === gameState.players.indexOf(currentPlayer);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-600 to-green-800 p-4">
      {/* Notification */}
      {notification && (
        <div className="fixed top-4 right-4 bg-white rounded-lg shadow-2xl p-4 max-w-sm z-50 animate-slide-in">
          <p className="text-gray-800 font-semibold">{notification}</p>
        </div>
      )}

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-4">
        <div className="bg-white rounded-lg shadow-xl p-4 flex flex-wrap gap-4 items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              ซูเปอร์ริช Monopoly
            </h1>
            <p className="text-sm text-gray-600">Room: {roomCode}</p>
          </div>

          {currentPlayer && (
            <div className="flex items-center gap-4">
              <div
                className="w-8 h-8 rounded-full border-2 border-white shadow-lg"
                style={{ backgroundColor: currentPlayer.color || "#000" }}
              />
              <div>
                <p className="font-bold text-gray-800">{currentPlayer.name}</p>
                <p className="text-xl font-bold text-green-600">
                  ฿{currentPlayer.balance.toLocaleString()}
                </p>
              </div>
            </div>
          )}

          <button
            onClick={() => router.push("/lobby")}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-all"
          >
            ออกจากเกม
          </button>
        </div>
      </div>

      {/* Main game area */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Board - takes up 2 columns */}
        <div className="lg:col-span-2">
          {gameState.board && (
            <MonopolyBoard
              board={gameState.board}
              players={gameState.players}
              currentPlayerId={
                gameState.players[gameState.currentPlayerIndex || 0]?.id
              }
              onSpaceClick={handleSpaceClick}
            />
          )}
        </div>

        {/* Control panel */}
        <div className="space-y-4">
          {/* Dice */}
          <div className="bg-white rounded-lg shadow-xl p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
              {isMyTurn ? "ตาของคุณ!" : "รอคิว..."}
            </h3>

            <Dice
              onRoll={handleRollDice}
              disabled={!isMyTurn || currentPlayer?.inJail}
            />

            {currentPlayer?.inJail && (
              <div className="mt-4 space-y-2">
                <p className="text-center text-red-600 font-bold">
                  คุณติดคุก! ({currentPlayer.jailTurns} เทิร์นเหลือ)
                </p>
                <button
                  onClick={handlePayJail}
                  disabled={currentPlayer.balance < 500}
                  className="w-full py-2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 text-white font-bold rounded-lg transition-all"
                >
                  จ่าย ฿500 เพื่อออกจากคุก
                </button>
              </div>
            )}

            {isMyTurn && !currentPlayer?.inJail && (
              <button
                onClick={handleEndTurn}
                className="w-full mt-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg transition-all"
              >
                จบเทิร์น
              </button>
            )}
          </div>

          {/* Player list */}
          <div className="bg-white rounded-lg shadow-xl p-4">
            <h3 className="text-lg font-bold text-gray-800 mb-3">
              ผู้เล่น ({gameState.players.length})
            </h3>
            <div className="space-y-2">
              {gameState.players
                .sort((a, b) => (a.turnOrder || 0) - (b.turnOrder || 0))
                .map((player, index) => {
                  const isCurrentTurn = player.id === gameState.players[gameState.currentPlayerIndex || 0]?.id;
                  return (
                    <div
                      key={player.id}
                      className={`p-3 rounded-lg ${
                        isCurrentTurn
                          ? "bg-green-100 border-2 border-green-500"
                          : "bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {player.turnOrder && (
                          <div className="w-8 h-8 rounded-full bg-blue-500 text-white font-bold flex items-center justify-center text-sm">
                            {player.turnOrder}
                          </div>
                        )}
                        <div
                          className="w-6 h-6 rounded-full border-2 border-white shadow"
                          style={{ backgroundColor: player.color || "#000" }}
                        />
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800">
                            {player.name}
                            {player.inJail && " 🔒"}
                            {isCurrentTurn && " 👈"}
                          </p>
                          <p className="text-sm text-gray-600">
                            ฿{player.balance.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Current player's properties */}
          {currentPlayer && currentPlayer.deedCards && currentPlayer.deedCards.length > 0 && (
            <div className="bg-white rounded-lg shadow-xl p-4">
              <h3 className="text-lg font-bold text-gray-800 mb-3">
                ทรัพย์สินของคุณ
              </h3>
              <div className="space-y-2">
                {gameState.properties
                  ?.filter(p => p.owner === playerId)
                  .map((property) => (
                    <button
                      key={property.id}
                      onClick={() => setSelectedProperty(property)}
                      className="w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-left transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-8 rounded"
                          style={{ backgroundColor: property.color }}
                        />
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800">
                            {property.name}
                          </p>
                          <p className="text-xs text-gray-600">
                            {property.hasHotel
                              ? "🏨 โรงแรม"
                              : property.houses! > 0
                              ? `🏠 ${property.houses} หลัง`
                              : "ที่ดินเปล่า"}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Current player's chance cards */}
          {currentPlayer && currentPlayer.chanceCards && currentPlayer.chanceCards.length > 0 && (
            <div className="bg-white rounded-lg shadow-xl p-4">
              <h3 className="text-lg font-bold text-gray-800 mb-3">
                🎴 การ์ดโอกาสของคุณ ({currentPlayer.chanceCards.length})
              </h3>
              <div className="space-y-2">
                {currentPlayer.chanceCards.map((card) => (
                  <div
                    key={card.id}
                    className="p-3 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg border-2 border-yellow-400"
                  >
                    <p className="text-sm font-semibold text-gray-800">
                      {card.text}
                    </p>
                    {card.amount !== undefined && card.amount !== 0 && (
                      <p className={`text-xs font-bold mt-1 ${card.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {card.amount > 0 ? '+' : ''}฿{Math.abs(card.amount).toLocaleString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {selectedProperty && (
        <PropertyModal
          property={selectedProperty}
          canBuy={canBuyProperty}
          canBuild={selectedProperty.owner === playerId}
          currentPlayer={currentPlayer}
          players={gameState.players}
          onBuy={handleBuyProperty}
          onBuildHouse={handleBuildHouse}
          onBuildHotel={handleBuildHotel}
          onClose={() => {
            setSelectedProperty(null);
            setCanBuyProperty(false);
          }}
        />
      )}

      {chanceCard && (
        <ChanceModal
          card={chanceCard}
          onConfirm={() => setChanceCard(null)}
        />
      )}
    </div>
  );
}
