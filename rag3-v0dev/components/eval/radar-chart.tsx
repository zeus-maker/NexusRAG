'use client'

interface RadarDatum {
  dim: string
  value: number
}

export function RadarChart({ data }: { data: RadarDatum[] }) {
  const size = 200
  const center = size / 2
  const radius = 70
  const n = data.length
  const levels = [0.25, 0.5, 0.75, 1]

  const point = (i: number, r: number) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    }
  }

  const polygon = (scale: number) =>
    data
      .map((_, i) => {
        const p = point(i, radius * scale)
        return `${p.x},${p.y}`
      })
      .join(' ')

  const dataPolygon = data
    .map((d, i) => {
      const p = point(i, radius * (d.value / 100))
      return `${p.x},${p.y}`
    })
    .join(' ')

  return (
    <div className="flex justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* grid rings */}
        {levels.map((lv) => (
          <polygon
            key={lv}
            points={polygon(lv)}
            fill="none"
            className="stroke-border"
            strokeWidth="1"
          />
        ))}
        {/* axes */}
        {data.map((_, i) => {
          const p = point(i, radius)
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={p.x}
              y2={p.y}
              className="stroke-border"
              strokeWidth="1"
            />
          )
        })}
        {/* data area */}
        <polygon
          points={dataPolygon}
          className="fill-primary/20 stroke-primary"
          strokeWidth="2"
        />
        {data.map((d, i) => {
          const p = point(i, radius * (d.value / 100))
          return <circle key={i} cx={p.x} cy={p.y} r="2.5" className="fill-primary" />
        })}
        {/* labels */}
        {data.map((d, i) => {
          const p = point(i, radius + 18)
          return (
            <text
              key={i}
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-muted-foreground text-[9px]"
            >
              {d.dim}
            </text>
          )
        })}
      </svg>
    </div>
  )
}
