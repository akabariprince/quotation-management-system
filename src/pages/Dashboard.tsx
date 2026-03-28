import React, { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getVisibleNavItems } from "@/config/navigation";

const CARD_W = 170;
const CARD_H = 146;
const PAD = 5;
const CELL_H = CARD_H + PAD * 2; // 156px per row
const COL_W = CARD_W + PAD * 2; // 180px per column
const BG = "#e06b0a";

const Dashboard: React.FC = () => {
  const { hasPermission, hasAnyPermission } = useAuth();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [perCol, setPerCol] = useState(4);

  const cards = getVisibleNavItems(hasPermission, hasAnyPermission, [
    "/dashboard",
  ]);

  useEffect(() => {
    const calc = () => {
      if (!containerRef.current) return;
      const h = containerRef.current.clientHeight;
      setPerCol(Math.max(1, Math.floor(h / CELL_H)));
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  const columns: (typeof cards)[] = [];
  for (let i = 0; i < cards.length; i += perCol) {
    columns.push(cards.slice(i, i + perCol));
  }

  return (
    <div className="flex flex-col h-full mx-2">
      <div className="flex flex-1 min-h-0">
        <div ref={containerRef} className="flex flex-shrink-0">
          {cards.length === 0 ? (
            <div className="flex items-center justify-center h-full px-12">
              <p className="text-sm text-gray-400">No modules available</p>
            </div>
          ) : (
            columns.map((col, colIdx) => (
              <div
                key={colIdx}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  flexShrink: 0,
                  width: COL_W,
                  overflow: "hidden",
                }}
              >
                {col.map((card) => (
                  <div key={card.path} style={{ padding: PAD }}>
                    <button
                      onClick={() => navigate(card.path)}
                      className="group flex flex-col justify-between p-4 cursor-pointer
                                 transition-all duration-200
                                 border border-transparent hover:border-white/30
                                 hover:shadow-lg text-left flex-shrink-0"
                      style={{ background: BG, width: CARD_W, height: CARD_H }}
                    >
                      <card.icon
                        className="h-10 w-10"
                        style={{ color: "#d9d9d9" }}
                      />
                      <span
                        className="text-sm font-semibold"
                        style={{ color: "white", textTransform: "uppercase" }}
                      >
                        {card.label}
                      </span>
                    </button>
                  </div>
                ))}

                {/* ✅ FIX: filler wrapped with same padding as cards */}
                <div
                  style={{
                    flexGrow: 1,
                    minHeight: 0,
                    padding: PAD,
                    display: "flex",
                  }}
                >
                  <div style={{ background: BG, flex: 1, minHeight: 0 }} />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right fill with matching spacing */}
        <div
          className="flex-1 min-w-0"
          style={{
            background: BG,
            margin: PAD,
          }}
        />
      </div>
    </div>
  );
};

export default Dashboard;
