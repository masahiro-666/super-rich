"use client";

import { DeedCard, Player } from "@/types/game";

interface PropertyModalProps {
  property: DeedCard;
  canBuy?: boolean;
  canBuild?: boolean;
  currentPlayer?: Player;
  players?: Player[];
  onBuy?: () => void;
  onBuildHouse?: () => void;
  onBuildHotel?: () => void;
  onClose: () => void;
}

export default function PropertyModal({
  property,
  canBuy,
  canBuild,
  currentPlayer,
  players,
  onBuy,
  onBuildHouse,
  onBuildHotel,
  onClose,
}: PropertyModalProps) {
  const owner = property.owner ? players?.find(p => p.id === property.owner) : null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Property color header */}
        <div
          className="h-16 flex items-center justify-center"
          style={{ backgroundColor: property.color || "#ccc" }}
        >
          <h2 className="text-2xl font-bold text-white drop-shadow-lg">
            {property.name}
          </h2>
        </div>

        {/* Property details */}
        <div className="p-6 space-y-4">
          {/* Owner information */}
          <div className="flex justify-between items-center pb-4 border-b bg-gray-50 rounded-lg p-3 -mt-2">
            <span className="text-lg font-semibold">เจ้าของ:</span>
            {owner ? (
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full border-2 border-white shadow"
                  style={{ backgroundColor: owner.color || "#000" }}
                />
                <span className="text-lg font-bold text-blue-600">{owner.name}</span>
              </div>
            ) : (
              <span className="text-lg font-bold text-gray-500">ยังไม่มีเจ้าของ</span>
            )}
          </div>

          {/* Price */}
          <div className="flex justify-between items-center pb-4 border-b">
            <span className="text-lg font-semibold">ราคา:</span>
            <span className="text-xl font-bold text-green-600">
              ฿{property.price?.toLocaleString()}
            </span>
          </div>

          {/* Rent information */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>ค่าเช่า (ที่ดินเปล่า):</span>
              <span className="font-semibold">฿{property.rent}</span>
            </div>
            {property.rentWithHouse1 && (
              <>
                <div className="flex justify-between">
                  <span>บ้าน 1 หลัง:</span>
                  <span className="font-semibold">
                    ฿{property.rentWithHouse1}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>บ้าน 2 หลัง:</span>
                  <span className="font-semibold">
                    ฿{property.rentWithHouse2}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>บ้าน 3 หลัง:</span>
                  <span className="font-semibold">
                    ฿{property.rentWithHouse3}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>บ้าน 4 หลัง:</span>
                  <span className="font-semibold">
                    ฿{property.rentWithHouse4}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-bold">โรงแรม:</span>
                  <span className="font-bold text-red-600">
                    ฿{property.rentWithHotel}
                  </span>
                </div>
              </>
            )}
            {property.housePrice && (
              <div className="flex justify-between border-t pt-2">
                <span>ราคาบ้าน/โรงแรม:</span>
                <span className="font-semibold">
                  ฿{property.housePrice}
                </span>
              </div>
            )}
          </div>

          {/* Current status */}
          {owner && (
            <div className="bg-gray-100 rounded-lg p-3 mt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">สถานะ:</span>
                <span className="text-sm">
                  {property.hasHotel
                    ? "🏨 โรงแรม"
                    : property.houses! > 0
                    ? `🏠 บ้าน ${property.houses} หลัง`
                    : "ที่ดินเปล่า"}
                </span>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-2 pt-4">
            {canBuy && (
              <button
                onClick={onBuy}
                disabled={currentPlayer && currentPlayer.balance < property.price!}
                className={`
                  w-full py-3 rounded-lg font-bold text-white transition-all
                  ${
                    currentPlayer && currentPlayer.balance < property.price!
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700 active:scale-95"
                  }
                `}
              >
                {currentPlayer && currentPlayer.balance < property.price!
                  ? "เงินไม่พอ"
                  : `ซื้อ ฿${property.price?.toLocaleString()}`}
              </button>
            )}

            {canBuild && !property.hasHotel && property.houses! < 4 && (
              <button
                onClick={onBuildHouse}
                disabled={currentPlayer && currentPlayer.balance < property.housePrice!}
                className={`
                  w-full py-3 rounded-lg font-bold text-white transition-all
                  ${
                    currentPlayer && currentPlayer.balance < property.housePrice!
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 active:scale-95"
                  }
                `}
              >
                สร้างบ้าน ฿{property.housePrice?.toLocaleString()}
              </button>
            )}

            {canBuild && !property.hasHotel && property.houses === 4 && (
              <button
                onClick={onBuildHotel}
                disabled={currentPlayer && currentPlayer.balance < property.housePrice!}
                className={`
                  w-full py-3 rounded-lg font-bold text-white transition-all
                  ${
                    currentPlayer && currentPlayer.balance < property.housePrice!
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-red-600 hover:bg-red-700 active:scale-95"
                  }
                `}
              >
                สร้างโรงแรม ฿{property.housePrice?.toLocaleString()}
              </button>
            )}

            <button
              onClick={onClose}
              className="w-full py-3 rounded-lg font-bold text-gray-700 bg-gray-200 hover:bg-gray-300 transition-all"
            >
              ปิด
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
