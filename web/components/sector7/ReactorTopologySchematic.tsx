"use client";

type ReactorTopologySchematicProps = {
  /** When true, IT perimeter shows breach / lateral movement (ties to live anomaly). */
  attackActive?: boolean;
  className?: string;
  /** Expand to fill a dashboard card — no outer border or inner title gutter. */
  fillContainer?: boolean;
};

/**
 * Facility schematic — reactor topology with marching-ants edges and IT-edge attack styling.
 * Colors follow SECTOR-7 tokens: secondary cyan, primary-fixed amber accent, error on breach.
 */
export function ReactorTopologySchematic({
  attackActive = false,
  className = "",
  fillContainer = false,
}: ReactorTopologySchematicProps) {
  const shell = fillContainer
    ? "relative flex h-full min-h-[200px] w-full flex-1 flex-col overflow-hidden bg-[#0a0a0c]"
    : "relative overflow-hidden rounded-sm border border-outline-variant/20 bg-[#0a0a0c]";

  return (
    <div
      className={`${shell} ${className}`}
      role="img"
      aria-label={
        attackActive
          ? "Facility topology: external threat active at IT network edge"
          : "Facility topology: all paths nominal"
      }
    >
      <div
        className="s7-topology-backdrop pointer-events-none absolute inset-0"
        aria-hidden
      />

      {fillContainer ? (
        <div
          className={`pointer-events-none absolute right-2 top-2 z-10 flex items-center gap-1.5 rounded-sm border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider sm:right-3 sm:top-3 sm:text-[10px] ${
            attackActive
              ? "border-error/60 bg-error-container/30 text-error animate-pulse"
              : "border-secondary/35 bg-secondary/10 text-secondary"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              attackActive ? "bg-error shadow-[0_0_8px_#ffb4ab]" : "bg-secondary shadow-[0_0_6px_#5ed4ff]"
            }`}
          />
          {attackActive ? "Breach detected" : "Perimeter nominal"}
        </div>
      ) : null}

      <div
        className={
          fillContainer
            ? "relative flex min-h-0 flex-1 flex-col"
            : "relative px-2 pb-3 pt-2 sm:px-3 sm:pb-4 sm:pt-2.5"
        }
      >
        {!fillContainer ? (
          <div className="mb-1 flex items-start justify-between gap-2 sm:mb-2">
            <p className="font-label text-[9px] uppercase tracking-[0.2em] text-on-surface-variant sm:text-[10px]">
              Facility schematic — reactor topology
            </p>
            <div
              className={`flex items-center gap-1.5 rounded-sm border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider sm:text-[10px] ${
                attackActive
                  ? "border-error/60 bg-error-container/30 text-error animate-pulse"
                  : "border-secondary/35 bg-secondary/10 text-secondary"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  attackActive ? "bg-error shadow-[0_0_8px_#ffb4ab]" : "bg-secondary shadow-[0_0_6px_#5ed4ff]"
                }`}
              />
              {attackActive ? "IT edge breach" : "Perimeter nominal"}
            </div>
          </div>
        ) : null}

        <svg
          className={
            fillContainer
              ? "block h-full min-h-[200px] w-full flex-1"
              : "h-[min(52vw,260px)] w-full sm:h-[240px] lg:h-[260px]"
          }
          viewBox="0 0 420 248"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <filter id="s7-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="1.6" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <g className="s7-topology-scene">
          {/* Flow lines — OT / process (amber-green accent) */}
          <g
            className="s7-topology-flow"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path
              vectorEffect="nonScalingStroke"
              className="s7-topology-dash-line s7-topology-dash-ot"
              d="M 66 58 L 66 68"
            />
            <path
              vectorEffect="nonScalingStroke"
              className="s7-topology-dash-line s7-topology-dash-ot"
              d="M 66 172 L 66 190"
            />
            <path
              vectorEffect="nonScalingStroke"
              className="s7-topology-dash-line s7-topology-dash-ot"
              d="M 104 120 L 124 120"
            />
            <path
              vectorEffect="nonScalingStroke"
              className="s7-topology-dash-line s7-topology-dash-ot"
              d="M 178 120 L 200 120"
            />
            <path
              vectorEffect="nonScalingStroke"
              className="s7-topology-dash-line s7-topology-dash-ot"
              d="M 151 144 L 151 168"
            />
            <path
              vectorEffect="nonScalingStroke"
              className="s7-topology-dash-line s7-topology-dash-ot"
              d="M 225 156 L 225 176"
            />
            <path
              vectorEffect="nonScalingStroke"
              className="s7-topology-dash-line s7-topology-dash-ot"
              d="M 78 48 L 225 48 L 225 72"
            />
          </g>

          {/* IT uplink — cyan; turns hostile when attacking */}
          <g
            className={attackActive ? "s7-topology-flow-attack" : "s7-topology-flow-it"}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path
              vectorEffect="nonScalingStroke"
              className={`s7-topology-dash-line ${attackActive ? "s7-topology-dash-attack" : "s7-topology-dash-it"}`}
              d="M 250 120 L 298 120"
            />
          </g>

          {attackActive ? (
            <>
              <path
                vectorEffect="nonScalingStroke"
                d="M 371 42 L 371 82 L 321 96"
                fill="none"
                className="s7-topology-dash-line s7-topology-dash-threat"
                strokeLinejoin="round"
              />
              <circle
                cx="371"
                cy="36"
                r="5"
                fill="none"
                className="s7-topology-threat-pulse"
              />
            </>
          ) : null}

          {/* Nodes */}
          <g className="font-label" style={{ fontSize: "8px" }}>
            {/* Pump A */}
            <circle
              cx="66"
              cy="48"
              r="11"
              fill="rgba(144, 77, 0, 0.12)"
              stroke="rgba(255, 202, 161, 0.65)"
              strokeWidth="1.2"
            />
            <text
              x="66"
              y="51"
              textAnchor="middle"
              fill="#e5e2e1"
              className="font-label"
              style={{ fontSize: "7px" }}
            >
              A
            </text>
            <text
              x="86"
              y="42"
              fill="rgba(198, 198, 198, 0.75)"
              className="font-label"
              style={{ fontSize: "6px", letterSpacing: "0.08em" }}
            >
              PUMP A
            </text>

            {/* Reactor */}
            <rect
              className="s7-topology-reactor-hull"
              x="28"
              y="68"
              width="76"
              height="104"
              rx="5"
              fill="rgba(144, 77, 0, 0.08)"
              stroke="rgba(255, 202, 161, 0.75)"
              strokeWidth="1.4"
            />
            <circle
              className="s7-topology-core-ring"
              cx="66"
              cy="118"
              r="18"
              fill="none"
              stroke="rgba(255, 202, 161, 0.2)"
              strokeWidth="1"
            />
            <text
              x="66"
              y="108"
              textAnchor="middle"
              fill="#ffcaa1"
              className="font-label"
              style={{ fontSize: "9px", letterSpacing: "0.06em" }}
            >
              REACTOR
            </text>
            <text
              x="66"
              y="120"
              textAnchor="middle"
              fill="rgba(255, 202, 161, 0.55)"
              className="font-label"
              style={{ fontSize: "6.5px" }}
            >
              CORE
            </text>
            <circle
              className="s7-topology-status-led"
              cx="96"
              cy="74"
              r="3"
              fill="#ffcaa1"
              filter="url(#s7-glow)"
              opacity="0.95"
            />

            {/* Pump B */}
            <circle
              cx="66"
              cy="200"
              r="11"
              fill="rgba(144, 77, 0, 0.12)"
              stroke="rgba(255, 202, 161, 0.65)"
              strokeWidth="1.2"
            />
            <text
              x="66"
              y="203"
              textAnchor="middle"
              fill="#e5e2e1"
              className="font-label"
              style={{ fontSize: "7px" }}
            >
              B
            </text>
            <text
              x="86"
              y="214"
              fill="rgba(198, 198, 198, 0.75)"
              className="font-label"
              style={{ fontSize: "6px", letterSpacing: "0.08em" }}
            >
              PUMP B
            </text>

            {/* Coolant */}
            <rect
              x="124"
              y="82"
              width="54"
              height="62"
              rx="4"
              fill="rgba(144, 77, 0, 0.06)"
              stroke="rgba(255, 202, 161, 0.7)"
              strokeWidth="1.2"
            />
            <text
              x="151"
              y="108"
              textAnchor="middle"
              fill="#e5e2e1"
              className="font-label"
              style={{ fontSize: "7.5px", letterSpacing: "0.04em" }}
            >
              COOLANT
            </text>
            <text
              x="151"
              y="118"
              textAnchor="middle"
              fill="rgba(229, 226, 225, 0.55)"
              className="font-label"
              style={{ fontSize: "6px" }}
            >
              SYSTEM
            </text>
            <circle
              className="s7-topology-status-led"
              cx="170"
              cy="88"
              r="2.5"
              fill="#ffcaa1"
              filter="url(#s7-glow)"
              opacity="0.9"
            />

            {/* Control */}
            <rect
              x="124"
              y="168"
              width="54"
              height="30"
              rx="3"
              fill="rgba(94, 212, 255, 0.06)"
              stroke="rgba(94, 212, 255, 0.35)"
              strokeWidth="1"
            />
            <text
              x="151"
              y="186"
              textAnchor="middle"
              fill="#c6c6c6"
              className="font-label"
              style={{ fontSize: "8px", letterSpacing: "0.08em" }}
            >
              CONTROL
            </text>

            {/* Turbine */}
            <rect
              x="200"
              y="72"
              width="50"
              height="84"
              rx="4"
              fill="rgba(144, 77, 0, 0.06)"
              stroke="rgba(255, 202, 161, 0.7)"
              strokeWidth="1.2"
            />
            <text
              x="225"
              y="108"
              textAnchor="middle"
              fill="#e5e2e1"
              className="font-label"
              style={{ fontSize: "7.5px", letterSpacing: "0.04em" }}
            >
              TURBINE
            </text>
            <text
              x="225"
              y="118"
              textAnchor="middle"
              fill="rgba(229, 226, 225, 0.55)"
              className="font-label"
              style={{ fontSize: "6px" }}
            >
              GEN
            </text>
            <circle
              className="s7-topology-status-led"
              cx="244"
              cy="78"
              r="2.5"
              fill="#ffcaa1"
              filter="url(#s7-glow)"
              opacity="0.9"
            />

            {/* Valve */}
            <path
              d="M 225 176 L 218 188 L 232 188 Z"
              fill="rgba(94, 212, 255, 0.08)"
              stroke="rgba(94, 212, 255, 0.45)"
              strokeWidth="1"
            />
            <text
              x="225"
              y="200"
              textAnchor="middle"
              fill="#9ca3af"
              className="font-label"
              style={{ fontSize: "6.5px", letterSpacing: "0.06em" }}
            >
              VALVE
            </text>

            {/* IT NET */}
            <g
              className={
                attackActive
                  ? "s7-topology-it-net--breach transition-colors duration-300"
                  : "transition-colors duration-300"
              }
            >
              <rect
                x="300"
                y="96"
                width="42"
                height="42"
                rx="4"
                fill={
                  attackActive
                    ? "rgba(147, 0, 10, 0.35)"
                    : "rgba(0, 77, 99, 0.35)"
                }
                stroke={attackActive ? "#ffb4ab" : "#5ed4ff"}
                strokeWidth={attackActive ? 1.8 : 1.3}
              />
              <text
                x="321"
                y="114"
                textAnchor="middle"
                fill={attackActive ? "#ffb4ab" : "#5ed4ff"}
                className="font-label"
                style={{ fontSize: "7.5px", letterSpacing: "0.06em" }}
              >
                IT
              </text>
              <text
                x="321"
                y="124"
                textAnchor="middle"
                fill={attackActive ? "rgba(255, 180, 171, 0.75)" : "rgba(94, 212, 255, 0.75)"}
                className="font-label"
                style={{ fontSize: "6.5px", letterSpacing: "0.08em" }}
              >
                NET
              </text>
            </g>

            {/* External threat label (only when attacking) */}
            {attackActive ? (
              <g className="s7-topology-threat-node">
                <rect
                  x="332"
                  y="14"
                  width="78"
                  height="28"
                  rx="3"
                  fill="rgba(147, 0, 10, 0.45)"
                  stroke="#ffb4ab"
                  strokeWidth="1.2"
                />
                <text
                  x="371"
                  y="26"
                  textAnchor="middle"
                  fill="#ffb4ab"
                  className="font-label"
                  style={{ fontSize: "7px", letterSpacing: "0.12em" }}
                >
                  EXTERNAL
                </text>
                <text
                  x="371"
                  y="35"
                  textAnchor="middle"
                  fill="rgba(255, 180, 171, 0.85)"
                  className="font-mono"
                  style={{ fontSize: "6px" }}
                >
                  THREAT
                </text>
              </g>
            ) : null}
          </g>
          </g>
        </svg>
      </div>
    </div>
  );
}
