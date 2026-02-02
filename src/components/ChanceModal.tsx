"use client";

import { ChanceCard } from "@/types/game";

interface ChanceModalProps {
  card: ChanceCard;
  onConfirm: () => void;
}

export default function ChanceModal({ card, onConfirm }: ChanceModalProps) {
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onConfirm}
    >
      <div
        className="bg-gradient-to-br from-yellow-200 to-yellow-400 rounded-xl shadow-2xl max-w-md w-full p-8 border-4 border-yellow-600"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            🎴 การ์ดโอกาส
          </h2>
          <div className="w-16 h-1 bg-yellow-600 mx-auto rounded-full" />
        </div>

        <div className="bg-white rounded-lg p-6 shadow-inner mb-6">
          <p className="text-xl font-semibold text-gray-800 text-center leading-relaxed">
            {card.text}
          </p>
        </div>

        {card.amount !== undefined && card.amount !== 0 && (
          <div className="text-center mb-4">
            <span
              className={`text-3xl font-bold ${
                card.amount > 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {card.amount > 0 ? "+" : ""}฿{Math.abs(card.amount).toLocaleString()}
            </span>
          </div>
        )}

        <button
          onClick={onConfirm}
          className="w-full py-4 rounded-lg font-bold text-white bg-green-600 hover:bg-green-700 active:scale-95 transition-all shadow-lg"
        >
          ตกลง
        </button>
      </div>
    </div>
  );
}
