import React, { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getVisibleNavItems } from "@/config/navigation";

const CARD_W = 180;
const CARD_H = 140;
const GAP = 12;

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
      const fit = Math.max(1, Math.floor((h + GAP) / (CARD_H + GAP)));
      setPerCol(fit);
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
    <div className="flex flex-col h-full">
      {/* ═══ Main ═══ */}
      <div className="flex flex-1 min-h-0">
        {/* ─── Cards — left ─── */}
        <div
          ref={containerRef}
          className="flex gap-3 px-3  flex-shrink-0"
          style={{ alignItems: "flex-start" }}
        >
          {cards.length === 0 ? (
            <div className="flex items-center justify-center h-full px-12">
              <p className="text-sm text-gray-400">No modules available</p>
            </div>
          ) : (
            columns.map((col, colIdx) => (
              <div
                key={colIdx}
                className="flex flex-col"
                style={{ gap: `${GAP}px` }}
              >
                {col.map((card) => (
                  <button
                    key={card.path}
                    onClick={() => navigate(card.path)}
                    className="group flex flex-col justify-between p-4 cursor-pointer transition-all duration-200 border border-transparent hover:border-white/30 hover:shadow-lg text-left flex-shrink-0"
                    style={{
                      background: "#e06b0a",
                      width: `${CARD_W}px`,
                      height: `${CARD_H}px`,
                    }}
                  >
                    <card.icon
                      className="h-10 w-10"
                      style={{ color: "#d9d9d9" }}
                    />
                    <span
                      className="text-xs font-normal"
                      style={{ color: "#d9d9d9" }}
                    >
                      {card.label}
                    </span>
                  </button>
                ))}
              </div>
            ))
          )}
        </div>

        {/* ─── Right fill — orange background ─── */}
        <div
          className="flex-1 min-w-0 mr-3"
          style={{ background: "#e06b0a" }}
        />
      </div>

      {/* ═══ Copyright ═══ */}
      <div className="py-3 text-center flex-shrink-0">
        <p className="text-xs text-gray-400">
          &copy; {new Date().getFullYear()} Ecstatics Spaces India Pvt. Ltd.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;