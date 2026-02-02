"use client";

import { BoardSpace, Player } from "@/types/game";

interface MonopolyBoardProps {
  board: BoardSpace[];
  players: Player[];
  currentPlayerId?: string;
  onSpaceClick?: (space: BoardSpace) => void;
}

export default function MonopolyBoard({
  board,
  players,
  currentPlayerId,
  onSpaceClick,
}: MonopolyBoardProps) {
  // Convert hex color to lighter version with opacity
  const getLightColor = (hexColor: string, opacity: number = 0.3) => {
    // Remove # if present
    const hex = hexColor.replace('#', '');
    
    // Convert to RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // Return rgba with opacity
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  const getPlayersAtPosition = (position: number) => {
    return players.filter((p) => p.position === position && !p.isBank);
  };

  const renderSpace = (space: BoardSpace, index: number) => {
    const playersHere = getPlayersAtPosition(index);
    const isOwned = space.property?.owner;
    const owner = isOwned
      ? players.find((p) => p.id === space.property?.owner)
      : null;

    // Determine background color
    let backgroundColor = "";
    if (space.type === "start") backgroundColor = "bg-red-500";
    else if (space.type === "jail") backgroundColor = "bg-orange-400";
    else if (space.type === "free") backgroundColor = "bg-blue-400";
    else if (space.type === "gotoJail") backgroundColor = "bg-red-700";
    else if (space.type === "chance") backgroundColor = "bg-yellow-300";
    else if (space.type === "tax") backgroundColor = "bg-pink-300";
    else if (space.type === "station") backgroundColor = "bg-gray-300";
    else if (space.type === "utility") backgroundColor = "bg-blue-200";
    else if (space.type === "city") backgroundColor = "bg-white";

    return (
      <div
        key={space.id}
        onClick={() => onSpaceClick?.(space)}
        className={`
          relative border-2 border-gray-800 p-2 cursor-pointer
          hover:bg-gray-100 transition-colors
          ${backgroundColor}
          ${space.type === "start" || space.type === "gotoJail" ? "text-white" : ""}
        `}
        style={{
          minHeight: "100px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: owner && owner.color ? getLightColor(owner.color, 0.25) : undefined,
        }}
      >
        {/* Color indicator for properties */}
        {space.color && (
          <div
            className="absolute top-0 left-0 right-0 h-3"
            style={{ backgroundColor: space.color }}
          />
        )}

        {/* Space name */}
        <div className="text-xs font-bold mt-2 text-center">{space.name}</div>

        {/* Price - show for city, station, utility */}
        {(space.type === "city" || space.type === "station" || space.type === "utility") && space.property?.price && (
          <div className="text-xs text-center font-semibold text-gray-700 bg-white bg-opacity-70 rounded px-1">
            ราคา: ฿{space.property.price.toLocaleString()}
          </div>
        )}

        {/* Tax amount */}
        {space.type === "tax" && space.price && (
          <div className="text-xs text-center font-semibold text-red-600">
            ฿{space.price.toLocaleString()}
          </div>
        )}

        {/* Owner indicator */}
        {owner && (
          <div
            className="absolute top-1 right-1 w-4 h-4 rounded-full border-2 border-white"
            style={{ backgroundColor: owner.color || "#000" }}
            title={`เจ้าของ: ${owner.name}`}
          />
        )}

        {/* Houses/Hotels */}
        {space.property && space.property.houses! > 0 && (
          <div className="flex gap-1 justify-center mt-1">
            {Array.from({ length: space.property.houses! }).map((_, i) => (
              <div
                key={i}
                className="w-3 h-3 bg-green-600 border border-black"
                title="บ้าน"
              />
            ))}
          </div>
        )}
        {space.property?.hasHotel && (
          <div
            className="w-4 h-4 bg-red-600 border border-black mx-auto"
            title="โรงแรม"
          />
        )}

        {/* Players on this space */}
        {playersHere.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2 justify-center">
            {playersHere.map((player) => (
              <div
                key={player.id}
                className="w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-xs font-bold text-white"
                style={{ backgroundColor: player.color || "#000" }}
                title={player.name}
              >
                {player.name.charAt(0)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Classic Monopoly board layout (40 spaces)
  // Bottom row: 0-10 (right to left)
  // Left column: 11-19 (bottom to top)
  // Top row: 20-30 (left to right)
  // Right column: 31-39 (top to bottom)

  const bottomRow = board.slice(0, 11).reverse();
  const leftColumn = board.slice(11, 20);
  const topRow = board.slice(20, 31);
  const rightColumn = board.slice(31, 40);

  return (
    <div className="bg-green-200 p-4 rounded-lg shadow-2xl">
      <div className="grid grid-cols-11 gap-1 bg-green-300 p-2">
        {/* Top row */}
        <div className="col-span-11 grid grid-cols-11 gap-1">
          {topRow.map((space, index) => renderSpace(space, 20 + index))}
        </div>

        {/* Middle section with left column, center area, and right column */}
        <div className="col-span-11 grid grid-cols-11 gap-1">
          {/* Left column */}
          <div className="col-span-1 grid grid-rows-9 gap-1">
            {leftColumn.reverse().map((space, index) =>
              renderSpace(space, 19 - index)
            )}
          </div>

          {/* Center game info area */}
          <div className="col-span-9 bg-green-400 border-4 border-gray-800 rounded-lg p-4 flex flex-col items-center justify-center">
            <h2 className="text-4xl font-bold text-white mb-4">
              ซูเปอร์ริช
            </h2>
            <div className="text-white text-center">
              <p className="text-xl">Monopoly Thailand</p>
              <p className="text-sm mt-2">มอนโนโพลี่ไทยแลนด์</p>
            </div>
            
            {currentPlayerId && (
              <div className="mt-4 bg-white rounded-lg p-3 shadow-lg">
                <p className="text-sm font-semibold text-gray-800">
                  ตาของ:{" "}
                  {players.find((p) => p.id === currentPlayerId)?.name}
                </p>
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="col-span-1 grid grid-rows-9 gap-1">
            {rightColumn.map((space, index) =>
              renderSpace(space, 31 + index)
            )}
          </div>
        </div>

        {/* Bottom row */}
        <div className="col-span-11 grid grid-cols-11 gap-1">
          {bottomRow.map((space, index) =>
            renderSpace(space, 10 - index)
          )}
        </div>
      </div>
    </div>
  );
}
