"use client";

import { useState } from "react";

interface DiceProps {
  onRoll: (total: number, dice: number[]) => void;
  disabled?: boolean;
  isRolling?: boolean;
}

export default function Dice({ onRoll, disabled, isRolling }: DiceProps) {
  const [dice1, setDice1] = useState(1);
  const [dice2, setDice2] = useState(1);
  const [rolling, setRolling] = useState(false);

  const rollDice = () => {
    if (disabled || rolling || isRolling) return;

    setRolling(true);

    // Animate dice rolling
    let count = 0;
    const interval = setInterval(() => {
      setDice1(Math.floor(Math.random() * 6) + 1);
      setDice2(Math.floor(Math.random() * 6) + 1);
      count++;

      if (count > 10) {
        clearInterval(interval);
        const finalDice1 = Math.floor(Math.random() * 6) + 1;
        const finalDice2 = Math.floor(Math.random() * 6) + 1;
        setDice1(finalDice1);
        setDice2(finalDice2);
        setRolling(false);
        onRoll(finalDice1 + finalDice2, [finalDice1, finalDice2]);
      }
    }, 100);
  };

  const renderDiceFace = (value: number) => {
    const dots: Record<number, number[][]> = {
      1: [[1, 1]],
      2: [[0, 0], [2, 2]],
      3: [[0, 0], [1, 1], [2, 2]],
      4: [[0, 0], [0, 2], [2, 0], [2, 2]],
      5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
      6: [[0, 0], [0, 1], [0, 2], [2, 0], [2, 1], [2, 2]],
    };

    return (
      <div className="w-16 h-16 bg-white border-2 border-gray-800 rounded-lg shadow-lg relative">
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 p-2 gap-1">
          {Array.from({ length: 9 }).map((_, index) => {
            const row = Math.floor(index / 3);
            const col = index % 3;
            const hasDot = dots[value]?.some(([r, c]) => r === row && c === col);

            return (
              <div key={index} className="flex items-center justify-center">
                {hasDot && (
                  <div className="w-3 h-3 bg-gray-800 rounded-full" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-4">
        <div
          className={`transition-transform ${rolling ? "animate-bounce" : ""}`}
        >
          {renderDiceFace(dice1)}
        </div>
        <div
          className={`transition-transform ${rolling ? "animate-bounce" : ""}`}
        >
          {renderDiceFace(dice2)}
        </div>
      </div>

      <button
        onClick={rollDice}
        disabled={disabled || rolling || isRolling}
        className={`
          px-8 py-4 rounded-lg font-bold text-lg shadow-lg transition-all
          ${
            disabled || rolling || isRolling
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 active:scale-95"
          }
          text-white
        `}
      >
        {rolling || isRolling ? "กำลังทอย..." : "🎲 ทอยลูกเต๋า"}
      </button>

      <div className="text-center">
        <p className="text-xl font-bold text-gray-800">
          ผลรวม: {dice1 + dice2}
        </p>
        {dice1 === dice2 && !rolling && (
          <p className="text-sm text-green-600 font-semibold mt-1">
            🎉 ลูกเต๋าเหมือนกัน! ทอยอีกครั้ง
          </p>
        )}
      </div>
    </div>
  );
}
