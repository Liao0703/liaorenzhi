import React from 'react';

interface HexagonChartProps {
  scores: {
    safety: number;      // 安全规程
    maintenance: number; // 设备维护
    emergency: number;   // 应急处理
    signal: number;      // 信号系统
    dispatch: number;    // 调度规范
    operation: number;   // 作业标准
  };
}

const HexagonChart: React.FC<HexagonChartProps> = ({ scores }) => {
  // 组件尺寸（可根据容器宽度适配，这里取一个在卡片内更清晰的默认尺寸）
  const size = 260;
  const center = size / 2;
  const radius = 90;

  // 6个顶点的角度（从顶部开始，顺时针）
  const angles = [0, 60, 120, 180, 240, 300].map(angle => (angle - 90) * Math.PI / 180);
  
  // 标签和对应的分数
  const labels = [
    { name: '安全规程', score: scores.safety, color: '#ef4444' },
    { name: '信号系统', score: scores.signal, color: '#06b6d4' },
    { name: '调度规范', score: scores.dispatch, color: '#3b82f6' },
    { name: '作业标准', score: scores.operation, color: '#22c55e' },
    { name: '应急处理', score: scores.emergency, color: '#f59e0b' },
    { name: '设备维护', score: scores.maintenance, color: '#a855f7' }
  ];

  // 计算六边形顶点坐标
  const getHexagonPoints = (radiusScale: number) => {
    return angles.map(angle => ({
      x: center + Math.cos(angle) * radius * radiusScale,
      y: center + Math.sin(angle) * radius * radiusScale
    }));
  };

  // 生成背景六边形的路径字符串
  const getHexagonPath = (radiusScale: number) => {
    const points = getHexagonPoints(radiusScale);
    return `M ${points[0].x} ${points[0].y} ` + 
           points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ') + 
           ' Z';
  };

  // 生成数据六边形的路径字符串
  const getScorePath = () => {
    const scoreValues = [
      scores.safety,
      scores.signal, 
      scores.dispatch,
      scores.operation,
      scores.emergency,
      scores.maintenance
    ];
    
    const points = angles.map((angle, index) => ({
      x: center + Math.cos(angle) * radius * (scoreValues[index] / 100),
      y: center + Math.sin(angle) * radius * (scoreValues[index] / 100)
    }));

    return `M ${points[0].x} ${points[0].y} ` + 
           points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ') + 
           ' Z';
  };

  // 计算标签位置
  const getLabelPosition = (index: number) => {
    const angle = angles[index];
    const labelRadius = radius + 20;
    return {
      x: center + Math.cos(angle) * labelRadius,
      y: center + Math.sin(angle) * labelRadius
    };
  };

  // 计算分数显示位置
  const getScorePosition = (index: number) => {
    const angle = angles[index];
    const scoreRadius = radius + 35;
    return {
      x: center + Math.cos(angle) * scoreRadius,
      y: center + Math.sin(angle) * scoreRadius
    };
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <svg
        viewBox={`0 0 ${size + 80} ${size + 80}`}
        width="100%"
        height={size + 80}
        style={{ maxWidth: 520 }}
      >
        {/* 背景网格 */}
        {[0.2, 0.4, 0.6, 0.8, 1.0].map((scale, index) => (
          <path
            key={index}
            d={getHexagonPath(scale)}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="1"
          />
        ))}

        {/* 从中心到各顶点的连线 */}
        {angles.map((angle, index) => {
          const endX = center + Math.cos(angle) * radius;
          const endY = center + Math.sin(angle) * radius;
          return (
            <line
              key={index}
              x1={center}
              y1={center}
              x2={endX}
              y2={endY}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          );
        })}

        {/* 数据区域 */}
        <path
          d={getScorePath()}
          fill="rgba(59, 130, 246, 0.15)"
          stroke="#3b82f6"
          strokeWidth="2"
        />

        {/* 数据点 */}
        {angles.map((angle, index) => {
          const scoreValues = [
            scores.safety,
            scores.signal,
            scores.dispatch,
            scores.operation,
            scores.emergency,
            scores.maintenance
          ];
          const pointX = center + Math.cos(angle) * radius * (scoreValues[index] / 100);
          const pointY = center + Math.sin(angle) * radius * (scoreValues[index] / 100);
          
          return (
            <circle
              key={index}
              cx={pointX}
              cy={pointY}
              r="3"
              fill={labels[index].color}
              stroke="#fff"
              strokeWidth="1.5"
            />
          );
        })}

        {/* 标签 */}
        {labels.map((label, index) => {
          const pos = getLabelPosition(index);
          return (
            <text
              key={index}
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#374151"
              fontSize="12"
              fontWeight="bold"
            >
              {label.name}
            </text>
          );
        })}

        {/* 分数显示 */}
        {labels.map((label, index) => {
          const pos = getScorePosition(index);
          const scoreValues = [
            scores.safety,
            scores.signal,
            scores.dispatch,
            scores.operation,
            scores.emergency,
            scores.maintenance
          ];
          
          return (
            <text
              key={index}
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={label.color}
              fontSize="13"
              fontWeight="bold"
            >
              {scoreValues[index]}分
            </text>
          );
        })}
      </svg>

      {/* 图例 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '8px',
        marginTop: 12,
        width: '100%',
        maxWidth: 520
      }}>
        {labels.map((label, index) => {
          const scoreValues = [
            scores.safety,
            scores.signal,
            scores.dispatch,
            scores.operation,
            scores.emergency,
            scores.maintenance
          ];
          
          return (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 10px',
                background: '#f9fafb',
                border: '1px solid #eef2f7',
                borderRadius: 8
              }}
            >
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: label.color
                }}
              />
              <span style={{ color: '#374151', fontSize: 12, flex: 1 }}>
                {label.name}
              </span>
              <span style={{ color: label.color, fontSize: 12, fontWeight: 'bold' }}>
                {scoreValues[index]}分
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HexagonChart;